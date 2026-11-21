import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { money } from './demo'
import { receiptBrand } from './receiptData'
import { drawLogo, loadBrandLogo, savePdf, wrap } from './receiptPdf'

const width=595.28
const height=841.89
const margin=44
const ink=rgb(.059,.09,.165)
const teal=rgb(.043,.141,.431)
const muted=rgb(.278,.333,.412)
const line=rgb(.886,.91,.941)
const surface=rgb(.902,.945,1)
const columns={date:margin+10,description:margin+93,moneyIn:364,moneyOut:451,balance:width-margin-10}
const format=value=>value===null?'Unavailable':money(value)

export async function makeStatementPdf(statement,logoBytes) {
 const pdf=await PDFDocument.create()
 const logo=await pdf.embedPng(logoBytes)
 const regular=await pdf.embedFont(StandardFonts.Helvetica)
 const bold=await pdf.embedFont(StandardFonts.HelveticaBold)
 const glyphs=new Set(regular.getCharacterSet())
 const printable=value=>[...String(value)].map(char=>glyphs.has(char.codePointAt(0))?char:'?').join('')
 let page,y
 pdf.setTitle('SKEB-Pro Account Statement - '+statement.label)
 function startPage(first) {
   page=pdf.addPage([width,height])
   drawLogo(page,logo,height-32,width)
   page.drawText(receiptBrand,{x:(width-regular.widthOfTextAtSize(receiptBrand,11))/2,y:height-90,size:11,font:regular,color:teal})
   page.drawText('Account statement',{x:margin,y:height-133,size:24,font:bold,color:ink})
   page.drawText(statement.label+'  |  ATLAS Savings Account-i - Account ending 4812',{x:margin,y:height-154,size:10,font:regular,color:muted})
   y=height-181
   if(first) {
     page.drawRectangle({x:margin,y:y-55,width:width-margin*2,height:55,color:surface})
     const summary=[['Opening balance',statement.openingBalance],['Money in',statement.moneyIn],['Money out',statement.moneyOut],['Closing balance',statement.closingBalance]]
     summary.forEach(([label,value],index)=>{
       const x=margin+10+index*(width-margin*2)/4
       page.drawText(label,{x,y:y-19,size:9,font:regular,color:muted})
       page.drawText(format(value),{x,y:y-37,size:11,font:bold,color:ink})
     })
     y-=79
   }
   page.drawRectangle({x:margin,y:y-24,width:width-margin*2,height:24,color:surface})
   page.drawText('Date',{x:columns.date,y:y-15,size:9,font:bold,color:teal})
   page.drawText('Transaction',{x:columns.description,y:y-15,size:9,font:bold,color:teal})
   for(const [label,x] of [['Money in',columns.moneyIn],['Money out',columns.moneyOut],['Balance',columns.balance]]) right(label,x,y-15,bold,teal)
   y-=24
 }
 function right(text,x,baseline,font=regular,color=ink) {
   page.drawText(text,{x:x-font.widthOfTextAtSize(text,9),y:baseline,size:9,font,color})
 }
 startPage(true)
 if(!statement.transactions.length) page.drawText('No posted demo transactions for this month.',{x:columns.date,y:y-21,size:10,font:regular,color:muted})
 for(const item of statement.transactions) {
   const description=wrap(printable(item.name),bold,10,145)
   const reference=wrap(printable(item.id),regular,8,145)
   const rowHeight=Math.max(38,description.length*12+reference.length*10+13)
   if(y-rowHeight<62) startPage(false)
   page.drawText(printable(item.date),{x:columns.date,y:y-15,size:9,font:regular,color:muted})
   description.forEach((text,index)=>page.drawText(text,{x:columns.description,y:y-15-index*12,size:10,font:bold,color:ink}))
   reference.forEach((text,index)=>page.drawText(text,{x:columns.description,y:y-15-description.length*12-index*10,size:8,font:regular,color:muted}))
   if(item.amount>0) right(money(item.amount),columns.moneyIn,y-15)
   if(item.amount<0) right(money(-item.amount),columns.moneyOut,y-15)
   right(item.runningBalance===null?'-':money(item.runningBalance),columns.balance,y-15)
   y-=rowHeight
   page.drawLine({start:{x:margin,y},end:{x:width-margin,y},thickness:.5,color:line})
 }
 const pages=pdf.getPages()
 pages.forEach((current,index)=>{
   current.drawText('Demo statement. No real money moved.',{x:margin,y:34,size:9,font:regular,color:muted})
   const number='Page '+(index+1)+' of '+pages.length
   current.drawText(number,{x:width-margin-regular.widthOfTextAtSize(number,9),y:34,size:9,font:regular,color:muted})
 })
 return pdf.save()
}

export async function downloadStatement(statement) {
 const bytes=await makeStatementPdf(statement,await loadBrandLogo())
 savePdf(bytes,'skeb-pro-statement-'+statement.month+'.pdf')
}
