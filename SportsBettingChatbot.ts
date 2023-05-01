import express from 'express';
import axios from 'axios';
import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';

// Set up the API key for the OpenAI GPT API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Set up a function to call the OpenAI GPT API with a message and return the response text
const getOpenAIResponse = async (message: string): Promise<string> => {
  // Call the OpenAI GPT API with the user's message to get a response
  const openaiResponse = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
    prompt: `NBA and NFL chat bot: ${message}`,
    max_tokens: 150,
    n: 1,
    stop: ['\n']
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    }
  });

  // Extract the response text from the OpenAI API response
  const responseText = openaiResponse.data.choices[0].text;

  return responseText;
};

// Set up a GraphQL schema with a single "message" field that returns a string
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'ChatBotQuery',
    fields: {
      message: {
        type: GraphQLString,
        args: {
          message: { type: GraphQLString },
        },
        async resolve(parent, args) {
          const message = args.message;

          let responseText = "";

          // Check if the user is asking for stats
          if (message.toLowerCase().includes("stats")) {
            // Call the NBA.com API to get the current stats
            const nbaResponse = await axios.get('https://data.nba.net/10s/prod/v1/current/standings_conference.json');

            // Extract the relevant stats from the response
            const easternConferenceStandings = nbaResponse.data.league.standard.conference.east;
            const westernConferenceStandings = nbaResponse.data.league.standard.conference.west;

            // Construct the response text with the current stats
            responseText = "Current NBA standings:\n\nEastern Conference:\n";
            for (const team of easternConferenceStandings) {
              responseText += `${team.teamSitesOnly.teamName} (${team.win}-${team.loss})\n`;
            }
            responseText += "\nWestern Conference:\n";
            for (const team of westernConferenceStandings) {
              responseText += `${team.teamSitesOnly.teamName} (${team.win}-${team.loss})\n`;
            }
          } else {
            // Call the OpenAI GPT API to get a response
            responseText = await getOpenAIResponse(message);
          }

          return responseText;
        }
      },
    },
  }),
});

// Set up the Express app
const app = express();
const port = 3000;

// Set up a GraphQL endpoint
app.use('/graphql', express.json(), require('express-graphql')({
  schema: schema,
  graphiql: true,
}));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
