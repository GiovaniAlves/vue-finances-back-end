const { getUserId } = require('./../utils')
const moment = require('moment')

function accounts(_, args, context, info) {

   const userId = getUserId(context)
   return context.db.query.accounts({
      where: {
         OR: [
            { user: { id: userId } },
            { user: null }
         ]
      },
      orderBy: 'description_ASC'
   }, info)
}


function categories(_, { operation }, context, info) {

   const userId = getUserId(context)

   let AND = [
      {
         OR: [
            { user: { id: userId } },
            { user: null }
         ]
      }
   ]

   AND = !operation ? AND : [ ...AND, { operation } ]

   return context.db.query.categories({
      where: { AND },
      orderBy: 'description_ASC'
   }, info)
}


function records(_, {type, accountsIds, categoriesIds, month}, context, info) {

   const userId = getUserId(context)

   let AND = [ { user: {id: userId }}]

   AND = !type ? AND : [ ...AND, { type }]

   AND = !accountsIds || accountsIds.length === 0
      ? AND
      : [
         ...AND, 
         { OR: accountsIds.map(id => ({ account: { id } }) ) }
      ]

   AND = !categoriesIds || categoriesIds.length === 0
      ? AND
      : [
         ...AND, 
         { OR: categoriesIds.map(id => ({ category: { id } }) ) }
      ]
   
   if(month){
      const date = moment(month, 'MM-YYYY') //11-2021
      const startDate = date.startOf('month').toISOString()
      const endDate = date.endOf('month').toISOString()

      AND = [
         ...AND,
         { date_gte: startDate },
         { date_lte: endDate }
      ]
   }

   return context.db.query.records({
      where: { AND },
      orderBy: 'date_ASC'
   }, info)
}



function totalBalance(_, { date }, context, info) {

   const userId = getUserId(context)
   const dateIso = moment(date, 'YYYY-MM-DD').endOf('day').toISOString()
   const pgSchema = `${process.env.PRISMA_SERVICE}$${process.env.PRISMA_STAGE}`

   const mutation = `
      mutation TotalBalance($database: PrismaDatabase, $query: String!) {
         executeRaw(database: $database, query: $query)
      }
   `
   const variables = {
      database: 'default',
      query: `
         SELECT SUM("${pgSchema}"."Record"."amount") as totalbalance
            FROM "${pgSchema}"."Record"
            
            INNER JOIN "${pgSchema}"."_RecordToUser"
            ON "${pgSchema}"."_RecordToUser"."A" = "${pgSchema}"."Record"."id"
            
            WHERE "${pgSchema}"."_RecordToUser"."B" = '${userId}'
            AND "${pgSchema}"."Record"."date" <= '${dateIso}'
      `
   }

   return context.prisma.$graphql(mutation, variables)
      .then( response => {
         const totalBalance = response.executeRaw[0].totalbalance
         return totalBalance ? totalBalance : 0
      })
}


function user(_, args, context, info) {

   const userId = getUserId(context)
   return context.db.query.user( {where: { id: userId }}, info)
}

module.exports = {
   accounts,
   categories,
   records,
   totalBalance,
   user
}