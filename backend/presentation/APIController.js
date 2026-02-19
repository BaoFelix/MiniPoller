const generateUniqueId = require("../utils/utilities").generateUniqueId;

class APIController{
    constructor(sessionService){
        this.sessionService = sessionService;
    }

    createPoll = (req, res)=>{
        try{
            const pollData = req.body;
            const poll = this.sessionService.createSession(pollData);
            const pollId = poll.pollId;

            // Generate a unique token for the poll owner
            const ownerToken = generateUniqueId();

            this.sessionService.setOwnerToken(pollId, ownerToken);

            const pollUrl = `${req.protocol}://${req.get('host')}/poll/${pollId}?ownerToken=${ownerToken}`;
            
            console.log('req.get("host"):', req.get('host'));
            console.log('global.serverURL:', global.serverURL);

            res.status(201).json({
                pollId: pollId,
                pollUrl: pollUrl,
                pollData: poll.getDetails(),
            });
        } catch(error){
            res.status(400).json({error: error.message});
        }
    }

    getPoll = (req, res)=>{
        try{
            const pollId = req.params.pollId;
            const poll = this.sessionService.getSession(pollId);

            if(!poll){
                res.status(404).json({error: `Poll with ID ${pollId} not found`});
                return;
            }

            res.status(200).json(poll.getDetails());

        }
        catch(error){
            res.status(400).json({error: error.message});
        }
    }
    
    endPoll = (req, res)=>{
        try{
            const pollId = req.params.pollId;
            const { ownerToken } = req.body;

            if(!this.sessionService.verifyOwnerToken(pollId, ownerToken)){
                return res.status(403).json({error: 'Invalid owner token'});
            }
            
            this.sessionService.endSession(pollId);

            res.status(200).json({ message: 'Poll ended successfully' });
        }
        catch(error){
            res.status(400).json({error: error.message});
        }
    }

}

module.exports = APIController;
