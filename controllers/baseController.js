const baseController = {};

baseController.get = (req, res) => {
    res.status(200).send({
        success: 'true',
        message: 'Connected to Fight Scraper API.'
    });
};

export default baseController;