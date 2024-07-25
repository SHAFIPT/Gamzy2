

const loadMyAccount = async (req,res) =>{
    try {
        
        res.render('Useraccount')

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const loadaddress = async (req,res)=>{
    try {
        
        res.render('address')
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadMyAccount,
    loadaddress
}