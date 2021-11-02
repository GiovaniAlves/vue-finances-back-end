const { getUserId } = require('./../utils')

function user(_, args, context, info) {

   const userId = getUserId(context)
   return context.db.query.user( {where: { id: userId }}, info)
}

module.exports = {
   user
}