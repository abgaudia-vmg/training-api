export const utilGenerateUsername = ({
    first_name, 
    last_name, 
    domain='email.com'
}: {
    first_name: string;
    last_name: string;
    domain: string;
}): string => {

    const firstThreeLettersFname = first_name.slice(0,3)?.toLowerCase();
    const finalUsername = `${firstThreeLettersFname}${last_name}@${domain}`;


    return finalUsername;

};