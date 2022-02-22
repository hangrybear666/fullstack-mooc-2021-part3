const mongoose = require('mongoose')
require('dotenv').config()

const url = process.env.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url)
  .then(result => { // eslint-disable-line
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

const personSchema = new mongoose.Schema({
  _id: String,
  name: {
    type: String,
    minLength: 3,
    required: true },
  number: {
    type: String,
    minLength: 8,
    validate: {
      validator: function(v) {
        return /\d{3}-\d{5}/.test(v)
      },
      message: props => `${props.value} is not a valid phone number!`
    },
    required: [true, 'User phone number required'] },
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

module.exports = Person