const isProduction = process.env.NODE_ENV === 'production';

export const app_config = {
    domain: isProduction ? 'yourdomain.com' : 'localhost',
    domain_email: 'email.com',


    // computed properties for the access and refresh token expiration dates
    get accessTokenExp() { return new Date(Date.now() + 15 * 60 * 1000); }, // 15 minutes from now
    get refreshTokenExp() { return new Date(Date.now() + 20 * 60 * 60 * 1000); }, // 20 hours from now

    actoCookie: `acto_${process.env.NODE_ENV}`,
    retoCookie: `reto_${process.env.NODE_ENV}`,

    cookieOptions: {
        sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
        secure: isProduction,
    },
};