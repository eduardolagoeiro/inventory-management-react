import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
type Product {
  id: ID!
  name: String!
  price: Float!
  stock: Int!
}

type Query {
  products(page: Int!, perPage: Int!): [Product]
}

type Mutation {
  addProduct(name: String!, price: Float!, stock: Int!): Product
  updateProduct(id: ID!, name: String!, price: Float!, stock: Int!): Product
  removeProduct(id: ID!): Product
}
`;

const products: {
  id: string;
  name: string;
  price: number;
  stock: number;
}[] = [];
let nextId = 1;

const resolvers = {
  Query: {
    products: (_, { page, perPage }) =>
      products.slice((page - 1) * perPage, page * perPage),
  },
  Mutation: {
    addProduct: (
      _,
      { name, price, stock }: { name: string; price: number; stock: number }
    ) => {
      const newProduct = { id: String(nextId++), name, price, stock };
      products.push(newProduct);
      return newProduct;
    },
    updateProduct: (
      _,
      {
        id,
        name,
        price,
        stock,
      }: { id: string; name: string; price: number; stock: number }
    ) => {
      const productIndex = products.findIndex((product) => product.id === id);
      if (productIndex === -1) return null;
      const updatedProduct = { id, name, price, stock };
      products[productIndex] = updatedProduct;
      return updatedProduct;
    },
    removeProduct: (_, { id }: { id: string }) => {
      const productIndex = products.findIndex((product) => product.id === id);
      if (productIndex === -1) return null;
      return products.splice(productIndex, 1)[0];
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`🚀 Server ready at: ${url}`);
});
