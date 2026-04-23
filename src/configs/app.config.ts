const isProduction = process.env.NODE_ENV === 'production';

export const app_config = { // convert camelCase
    domain: isProduction ? 'yourdomain.com' : 'localhost',
    domain_email: 'email.com',
    get accessTokenExp() { return new Date(Date.now() + 15 * 60 * 1000); },
    get refreshTokenExp() { return new Date(Date.now() + 20 * 60 * 60 * 1000); },
    acto_cookie: `acto_${process.env.NODE_ENV}`,
    reto_cookie: `reto_${process.env.NODE_ENV}`,
    cookie_options: {
        sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        secure: isProduction,
    },
};