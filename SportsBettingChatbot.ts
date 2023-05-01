import express, { Request, Response } from 'express';
import axios from 'axios';

const app = express();
const port = 3000;

// Set up a GET route to handle incoming chat bot requests
app.get('/chatbot', async (req: Request, res: Response) => {
  // Check if the disclaimer has been accepted
  if (!req.query.disclaimerAccepted) {
    // If not, send a disclaimer message and a link to responsible gambling resources
    res.send("Welcome to the sports betting chat bot. Before we get started, please read and accept the following disclaimer:\n\nBetting can be dangerous and addictive. Please bet responsibly. For more information and resources on responsible gambling, please visit https://www.ncpgambling.org/help-treatment/national-helpline-1-800-522-4700/\n\nTo accept this disclaimer and proceed, please click the following link: /chatbot?disclaimerAccepted=true");
    return;
  }

  // Get the user's message from the request query parameters
  const message = req.query.message;

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
    // Call the OpenAI GPT API with the user's message to get a response
    const openaiResponse = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
      prompt: `NBA and NFL chat bot: ${message}`,
      max_tokens: 150,
      n: 1,
      stop: ['\n']
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    // Extract the response text from the OpenAI API response
    responseText = openaiResponse.data.choices[0].text;
  }

  // Send the response back to the chat bot
  res.send(responseText);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
