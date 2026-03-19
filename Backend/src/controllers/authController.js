const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    // We fetch user info directly from Google's People API using the access_token received from React
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!userInfoResponse.ok) {
        return res.status(401).json({ error: 'Failed to authenticate with Google' });
    }
    
    const { sub, email, name, picture } = await userInfoResponse.json();

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create user automatically (Seamless Signup)
      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture
      });
    } else if (!user.googleId) {
      // Link Google ID if they previously signed up manually but now use Google
      user.googleId = sub;
      user.avatar = picture;
      await user.save();
    }

    // Assign custom application JWT
    const JWT_SECRET = process.env.JWT_SECRET || 'cinemate_fallback_secret_999';
    const appToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(200).json({ 
      token: appToken, 
      user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } 
    });
  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({ error: 'Internal server error during Google authentication' });
  }
};
