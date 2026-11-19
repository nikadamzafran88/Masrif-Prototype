import { PDFDocument, StandardFonts, LineCapStyle, rgb } from 'pdf-lib'
import { receiptBrand, receiptDetails, receiptLogo, receiptNotice } from './receiptData'

const teal=rgb(.03,.36,.35)
const ink=rgb(.1,.2,.18)
const muted=rgb(.34,.44,.42)
const line=rgb(.88,.91,.91)
const surface=rgb(.92,.97,.95)
const width=390
const margin=24

export function wrap(text,font,size,maxWidth) {
 const result=[]
 let current=''
 for(const word of String(text).split(/\s+/)) {
   if(current&&font.widthOfTextAtSize(current+' '+word,size)>maxWidth){result.push(current);current=''}
   if(current){current+=' '+word;continue}
   for(const character of word){
     if(current&&font.widthOfTextAtSize(current+character,size)>maxWidth){result.push(current);current=''}
     current+=character
   }
 }
 if(current)result.push(current)
 return result.length?result:['']
}

export function drawLogo(page,svg,y,pageWidth=width) {
 const box=svg.match(/viewBox="([^"]+)"/)?.[1].split(' ').map(Number)
 if(!box||box.length!==4) throw new Error('Invalid receipt logo')
 const [left,top,w]=box
 const paths=[...svg.matchAll(/<path\s+([^>]+)>/g)]
 if(!paths.length) throw new Error('Receipt logo has no artwork')
 for(const [,attributes] of paths){
   const path=attributes.match(/\bd="([^"]+)"/)?.[1]
   if(!path) continue
   const stroke=attributes.match(/stroke-width="([^"]+)"/)?.[1]
   page.drawSvgPath(path,{
     x:(pageWidth-w)/2-left,y:y+top,
     ...(stroke?{borderColor:teal,borderWidth:Number(stroke),borderLineCap:LineCapStyle.Round}:{color:teal}),
   })
 }
}

export async function makeReceiptPdf(item,svg) {
 const pdf=await PDFDocument.create()
 const regular=await pdf.embedFont(StandardFonts.Helvetica)
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold)
 const info=receiptDetails(item)
 const glyphs=new Set(bold.getCharacterSet())
 const toMeasuredText=value=>[...String(value??'')].map(char=>glyphs.has(char.codePointAt(0))?char:'?').join('')
 const rows=info.rows.map(([label,value])=>{
   const text=String(value??'')
   const measured=toMeasuredText(text)
   const canvas=measured!==text&&typeof document!=='undefined'?document.createElement('canvas'):null
   const context=canvas?.getContext('2d')
   if(context) context.font='bold 11px Arial'
   const metrics=context?{widthOfTextAtSize:lineText=>context.measureText(lineText).width}:bold
   return {label,canvas:context?canvas:null,lines:wrap(context?text:measured,metrics,11,196)}
 })
 const rowHeights=rows.map(({lines})=>Math.max(33,lines.length*14+17))
 const detailHeight=rowHeights.reduce((sum,height)=>sum+height,0)
 const height=253+detailHeight+61
 const page=pdf.addPage([width,height])
 function center(value,y,size,font=regular,color=ink) {
   page.drawText(value,{x:(width-font.widthOfTextAtSize(value,size))/2,y,size,font,color})
 }
 pdf.setTitle('Masrif Receipt '+item.id)
 drawLogo(page,svg,height-34)
 center(receiptBrand,height-92,11,regular,teal)
 center('Transaction receipt',height-126,20,bold)
 page.drawRectangle({x:margin,y:height-227,width:width-margin*2,height:82,color:surface})
 center('TOTAL AMOUNT',height-169,9,bold,teal)
 center(info.amount,height-202,25,bold)
 let position=height-253
 for(const [index,{label,canvas,lines}] of rows.entries()){
   const bottom=position-rowHeights[index]
   page.drawText(label,{x:margin,y:position-17,size:10,font:regular,color:muted})
   if(canvas){
     await drawUnicodeValue(pdf,page,canvas,lines,position-9)
   }else{
     lines.forEach((text,i)=>page.drawText(text,{x:width-margin-bold.widthOfTextAtSize(text,11),y:position-17-i*14,size:11,font:bold,color:ink}))
   }
   page.drawLine({start:{x:margin,y:bottom},end:{x:width-margin,y:bottom},thickness:.6,color:line})
   position=bottom
 }
 center(receiptNotice,29,9,regular,muted)
 return pdf.save()
}

// Render the occasional reference outside the PDF standard font's character set.
async function drawUnicodeValue(pdf,page,canvas,lines,top) {
 const lineCount=lines.length
 canvas.width=588
 canvas.height=lineCount*42
 const context=canvas.getContext('2d')
 context.scale(3,3)
 context.font='bold 11px Arial'
 context.fillStyle='#19332e'
 context.textAlign='right'
 context.textBaseline='top'
 lines.forEach((text,i)=>context.fillText(text,196,i*14))
 const image=await pdf.embedPng(canvas.toDataURL('image/png'))
 page.drawImage(image,{x:width-margin-196,y:top-lineCount*14,width:196,height:lineCount*14})
}

export async function loadBrandLogo() {
 const response=await fetch(receiptLogo)
 if(!response.ok) throw new Error('Could not load the Masrif logo')
 return response.text()
}

export function savePdf(bytes,filename) {
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}))
 const link=document.createElement('a')
 link.href=url
 link.download=filename
 document.body.append(link)
 link.click()
 link.remove()
 setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export async function downloadReceipt(item) {
 const bytes=await makeReceiptPdf(item,await loadBrandLogo())
 savePdf(bytes,'masrif-receipt-'+String(item.id).replace(/[^a-zA-Z0-9_-]/g,'-')+'.pdf')
}
