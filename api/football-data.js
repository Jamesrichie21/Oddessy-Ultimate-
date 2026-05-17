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
    const { endpoint, competitionId, teamId } = req.query;
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    
    if (!apiKey) {
      console.error('FOOTBALL_DATA_API_KEY not set in environment variables');
      return res.status(500).json({ 
        error: 'API configuration error', 
        message: 'Server not properly configured' 
      });
    }
    
    let url = '';
    
    if (endpoint === 'standings') {
      if (!competitionId) {
        return res.status(400).json({ error: 'competitionId is required' });
      }
      url = `https://api.football-data.org/v4/competitions/${competitionId}/standings`;
    } 
    else if (endpoint === 'matches') {
      if (!competitionId) {
        return res.status(400).json({ error: 'competitionId is required' });
      }
      url = `https://api.football-data.org/v4/competitions/${competitionId}/matches?status=SCHEDULED&limit=20`;
    } 
    else if (endpoint === 'team-matches') {
      if (!teamId) {
        return res.status(400).json({ error: 'teamId is required' });
      }
      url = `https://api.football-data.org/v4/teams/${teamId}/matches?limit=5&status=FINISHED`;
    } 
    else {
      return res.status(400).json({ error: 'Invalid endpoint. Use: standings, matches, or team-matches' });
    }

    console.log(`[Football-Data] Fetching: ${endpoint} for competition ${competitionId || teamId}`);
    
    const response = await fetch(url, {
      headers: {
        'X-Auth-Token': apiKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    // Handle rate limiting
    if (response.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    // Handle invalid API key
    if (response.status === 403) {
      return res.status(403).json({ error: 'Invalid API key. Please check your Football-Data API key.' });
    }
    
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Football-Data API Error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
