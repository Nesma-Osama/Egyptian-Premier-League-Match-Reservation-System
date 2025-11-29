const User = require("../schemas/user")
const dotenv = require("dotenv")
const bcrypt=require("bcrypt")
dotenv.config()
const createAdmin = async ()=> {
    try {
        const admin = await User.findOne({ role: "Admin" })
        if (admin) {
            console.log("Admin is already exist")
            return
        }
        else {
            adminUserName = process.env.ADMIN_USERNAME
            adminPassword = process.env.ADMIN_PASSWORD
            adminEmail = process.env.ADMIN_EMAIL
            password = await bcrypt.hash(adminPassword, 10)
            const adminUser = new User({
                username: adminUserName,
                password: password,
                firstName: 'Nesma',
                lastName: 'Osama',
                birthDate: new Date('2003-07-21'),
                gender: 'F',
                city: 'Cairo',
                address: '',
                email: adminEmail,
                role: 'Admin',
                isAuthorized: true
            });
            const savedAdmin = await adminUser.save()
            console.log("Admin is saved correctly")
            console.log(savedAdmin)
        }
    }
    catch (error) {
            console("There is an error while creating the admin",error.message)
    }

}
module.exports=createAdmin 