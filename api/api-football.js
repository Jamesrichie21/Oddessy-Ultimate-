const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Auth-Token');
    return res.status(200).end();
  }

  try {
    const { endpoint, leagueId, season, teamId } = req.query;
    const apiKey = process.env.API_FOOTBALL_KEY;
    
    if (!apiKey) {
      console.error('API_FOOTBALL_KEY not set in environment variables');
      return res.status(500).json({ 
        error: 'API configuration error', 
        message: 'Server not properly configured' 
      });
    }
    
    let url = '';
    
    if (endpoint === 'standings') {
      if (!leagueId) {
        return res.status(400).json({ error: 'leagueId is required' });
      }
      url = `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season || '2024'}`;
    } 
    else if (endpoint === 'fixtures') {
      if (!leagueId) {
        return res.status(400).json({ error: 'leagueId is required' });
      }
      url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=${season || '2024'}&next=20`;
    } 
    else if (endpoint === 'team-fixtures') {
      if (!teamId) {
        return res.status(400).json({ error: 'teamId is required' });
      }
      url = `https://v3.football.api-sports.io/fixtures?team=${teamId}&last=5`;
    } 
    else {
      return res.status(400).json({ error: 'Invalid endpoint. Use: standings, fixtures, or team-fixtures' });
    }

    console.log(`[API-Football] Fetching: ${endpoint} for league ${leagueId || teamId}`);
    
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    // Handle rate limiting or errors
    if (response.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    if (response.status === 403) {
      return res.status(403).json({ error: 'Invalid API key. Please check your API-Football key.' });
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('API-Football Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
