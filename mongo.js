const mongoose = require('mongoose')
require('dotenv').config()

const url = process.env.MONGODB_URI
console.log(url)

mongoose.connect(url)

const personSchema = new mongoose.Schema({
  _id: String,
  id: Number,
  name: String,
  number: String,
})

/**
 * hides the implicit version and id values for further backend processing
 * does not alter the underlying data
 */
 personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Person = mongoose.model('Person', personSchema)

// Person.find({}).then(result => {
//   result.forEach(note => {
//     console.log(note)
//   })
//   mongoose.connection.close()
// })

const person = new Person({
  _id: mongoose.Types.ObjectId(),
  id: 4,
  name: "Mary Poppendieck",
  number: "39-23-6423122"
})

person.save().then(result => {
  console.log('person saved!', result)
  mongoose.connection.close()
})