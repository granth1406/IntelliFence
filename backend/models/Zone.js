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

  incidentType: {
    type: String,
    enum: ["accident", "traffic_jam", "crime", "suspicious_activity", "medical_emergency", "natural_disaster", "other"],
    default: "other"
  },

  approved: {
    type: Boolean,
    default: false
  },

  latitude: Number,
  longitude: Number,

  radius: {
    type: Number,
    default: 0.003
  },

  coordinates: [
    {
      latitude: Number,
      longitude: Number,
      _id:false
    }
  ],

  hexagonVertices: [
    {
      latitude: Number,
      longitude: Number,
      _id: false
    }
  ],

  status: {
    type: String,
    enum:["pending","approved","denied","resolved","verified_by_users","false"],
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

  userResponses: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      response: {
        type: String,
        enum: ["ok", "not_ok"]
      },
      timestamp: {
        type: Date,
        default: Date.now
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
