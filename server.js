import { ApolloServer, gql } from 'apollo-server';
import { RESTDataSource } from 'apollo-datasource-rest';

const typeDefs = gql`
  type Query {
    randomDog: Dog
    breed(name: String!): Dog
    huskyCrazy: HuskyList
  }

  type Dog {
    image: String
    status: String!
  }

  type HuskyList {
    images: [String]
    status: String!
  }
`;

class DogAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = "https://dog.ceo/api/";
  }

  async getRandomDog() {
    return await this.get("breeds/image/random");
  }

  async getAllBreeds() {
    const res = await this.get("breeds/list/all");
    return Object.keys(res.message);
  }

  async getRandomDogByBreed(breed) {
    const breeds = await this.getAllBreeds();
    if (!breeds.includes(breed)) return { status: "error: unknown breed" };

    const res = await this.get(`breed/${breed}/images`);

    if (!res || !res.message || !res.message.length) return null;

    const index = Math.floor(Math.random() * res.message.length);
    return {
      message: res.message[index],
      status: res.status
    };
  }

  async getAllHusky() {
    const res = await this.get('breed/husky/images');
    return {
      images: res.message,
      status: res.status
    }
  }
}

const resolvers = {
  Query: {
    randomDog: (parent, args, { dataSources }) => {
      return dataSources.dogAPI.getRandomDog();
    },
    breed: async (parent, { name }, { dataSources }) => {
      const breed = name.replace(/\s+/g, ""); // remove space
      return dataSources.dogAPI.getRandomDogByBreed(breed);
    },
    huskyCrazy: async (parent, args, { dataSources }) => {
      return dataSources.dogAPI.getAllHusky();
    }
  },
  Dog: {
    image: ({ message }) => message
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  tracing: true,
  dataSources: () => ({
    dogAPI: new DogAPI()
  })
});

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`);
});

