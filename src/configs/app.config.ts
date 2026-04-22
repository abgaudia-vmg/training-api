export const app_config = {
    domain: 'http://localhost:8200',
    
    accessTokenExp: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes from now
    refreshTokenExp: new Date(Date.now() + 20 * 60 * 60 * 1000), // 20 hours from now

    actoCookie: `acto_${process.env.NODE_ENV}`,
    retoCookie: `reto_${process.env.NODE_ENV}`,
};