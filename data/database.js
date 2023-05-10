import mongoose from "mongoose";

export const connectDB = async() => {
    try{
       const { connection } = await mongoose.connect(process.env.MONGO_URI,{
        dbName: "DapleProject"
       });
        console.log(`Server connected to DB ${connection.host}`)
    }   
    catch(error){
        console.log("Error", error)
        process.exit(1)
    }
}