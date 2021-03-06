const { getUserId } = require('./../utils')
const moment = require('moment')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

async function createAccount(_, { description }, context, info) {

   const userId = getUserId(context)
   return context.db.mutation.createAccount({
      data: {
         description,
         user: {
            connect: {
               id: userId
            }
         }
      }
   }, info )
}


function createCategory(_, { description, operation }, context, info) { 

   const userId = getUserId(context)
   return context.db.mutation.createCategory({
      data: {
         description,
         operation,
         user: {
            connect: {
               id: userId
            }
         }
      }
   }, info )
}


function createRecord(_, args, context, info) { 

   const date = moment(args.date)
   if(!date.isValid())
      throw new Error('Invalid date!')

   let { amount, type } = args
   if(
      (type === 'DEBIT' && amount > 0) || // +50 => -50
      (type === 'CREDIT' && amount < 0)   // -50 => +50
   ){
      amount = -amount
   }

   const userId = getUserId(context)
   return context.db.mutation.createRecord({
      data: {
         user: { connect: { id: userId } },
         account: { connect: { id: args.accountId } },
         category: { connect: { id: args.categoryId } },
         amount,
         type,
         date,
         description: args.description,
         tags: args.tags,
         note: args.note
      }
   }, info )
}


async function login(_, { email, password }, context, info) { 

   const user = await context.db.query.user( { where: { email } })
   if(!user)
      throw new Error('Invalid credentials!')

   const valid = await bcrypt.compare(password, user.password)
   if(!valid)
      throw new Error('Invalid credentials!')

   const token = jwt.sign( { userId: user.id }, JWT_SECRET, { expiresIn: '2h' })

   return {
      token,
      user
   }
}

 
async function signup(_, args, context, info) {
   
   const password = await bcrypt.hash( args.password, 10)
   const user = context.db.mutation.createUser( { data: { ...args, password} })

   const token = jwt.sign( { userId: user.id }, JWT_SECRET, { expiresIn: '2h' })

   return {
      token,
      user
   }
}

module.exports = {
   createAccount,
   createCategory,
   createRecord,
   login,
   signup
}