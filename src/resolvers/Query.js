const { getUserId } = require('./../utils')

function accounts(_, args, context, info) {

   const userId = getUserId(context)
   return context.db.query.accounts({
      where: {
         OR: [
            {
               user: {
                  id: userId
               }
            },
            {
               user: null
            }
         ]
      },
      orderBy: 'description_ASC'
   }, info)
}

function user(_, args, context, info) {

   const userId = getUserId(context)
   return context.db.query.user( {where: { id: userId }}, info)
}

module.exports = {
   accounts,
   user
}