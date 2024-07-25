


const loadCheakoutPage = async (req,res)=>{
    try {

        res.render('cheakOut')
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadCheakoutPage
}