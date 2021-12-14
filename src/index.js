const { GraphQLServer } = require('graphql-yoga')
const Binding = require('prisma-binding')
const { prisma } = require('./generated/prisma-client')

const { endpoint, origin, playground, secret } = require('./config')
const resolvers = require('./resolvers')

const server = new GraphQLServer({
   typeDefs: `${__dirname}/schema.graphql`,
   resolvers,
   context: request => ({
      ...request,
      db: new Binding.Prisma({
         typeDefs: `${__dirname}/generated/graphql-schema/prisma.graphql`,
         endpoint,
         secret
      }),
      prisma
   })
})

server.start({
   playground,
   cors: {
      origin
   }
}).then(() => console.log('Server running on localhost://4000'))
