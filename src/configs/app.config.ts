const isProduction = process.env.NODE_ENV === 'production';

export const appConfig = { // convert camelCase
    domain: isProduction ? 'yourdomain.com' : 'localhost',
    domain_email: 'email.com',
    get accessTokenExp() { return new Date(Date.now() + 15 * 60 * 1000); }, //15minutes actual
    get refreshTokenExp() { return new Date(Date.now() + 20 * 60 * 60 * 1000); }, //20 hours actual
    jwt_expiry: '15m', // 15 minutes actual
    // jwt_expiry: '5s', // 5 seconds for testing
    // get accessTokenExp() { return new Date(Date.now() + 5 * 1000); }, // 5 seconds for testing
    // get refreshTokenExp() { return new Date(Date.now() + 2 * 60 * 1000); }, // 2 minutes for testing
    acto_cookie: `acto_${process.env.NODE_ENV || 'local'}`,
    reto_cookie: `reto_${process.env.NODE_ENV || 'local'}`,
    cookie_options: {
        sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        secure: isProduction,
    },
    get getCurrentDate() { return new Date(); },
};