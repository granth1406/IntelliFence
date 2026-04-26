const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: ["incident","zone"],
    default: "incident"
  },

  title: {
    type: String, 
    required: true
  }, 
  
  description: {
    type : String,
    required : true
   },

  riskLevel: {
    type: String,
    enum: ["low","medium","high"],
    default: "medium"
  },

  latitude: Number,
  longitude: Number,

  coordinates: [
    {
      latitude: Number,
      longitude: Number,
      _id:false
    }
  ],

  status: {
    type: String,
    enum:["pending","verified by users","false","resolved"],
    default:"pending"
  },

  verificationScore:{
    type:Number,
    default:0
  },

  confirmations:[
    {
      user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
      },
      response:{
        type:String,
        enum:["confirm","reject"]
      }
    }
  ],

  alertLevel:{
    type:String,
    enum:["none","near","inside"],
    default:"none"
  }

},{timestamps:true});

module.exports = mongoose.model("Zone",zoneSchema);
