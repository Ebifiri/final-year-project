import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import jwt from 'jsonwebtoken';

const msStrategy = new MicrosoftStrategy(
  {
    clientID: 'dummy',
    clientSecret: 'dummy',
    callbackURL: 'dummy',
    scope: ['openid', 'profile', 'email'],
    tenant: 'common',
    authorizationURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenURL: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    addUPNAsEmail: true,
  },
  async (accessToken, refreshToken, params, profile, done) => {
    const idToken = params.id_token;
    let decoded = null;
    if (idToken) {
      decoded = jwt.decode(idToken);
    }
    console.log('Decoded ID token:', decoded);
    console.log('Profile:', profile);
    done(null, { id: 'test' });
  }
);

msStrategy.userProfile = function(accessToken, done) {
  done(null, { provider: 'microsoft' });
};

console.log('Strategy overrides userProfile:', msStrategy.userProfile !== undefined);
console.log('Strategy verify arity:', msStrategy._verify.length);
