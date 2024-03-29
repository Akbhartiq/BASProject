// Import the mongoose here
const mongoose = require("mongoose");

// Define the DataScheme here
const customerSchema = new mongoose.Schema(
  {
    gmail: {
      type: String,
      required: true,
    },
    password:
    {
      type: String,
      required: true,
    },
    bookspurchased:
    {
      type: mongoose.Schema.Types.Mixed,
    },
    booksrequested:
    {
      type: mongoose.Schema.Types.Mixed,
    }
  });

// Define the Employee Schema

const employeeSchema = new mongoose.Schema({
  gmail:
  {
    type: String,
    required: true,
  },
  password:
  {
    type: String,
    required: true,
  },
  salary:
  {
    type: Number,
    default: 2500,
  },
  booksSold:
  {
    type: mongoose.Schema.Types.Mixed
  }
})

// Define the owner Schema
const ownerSchema = new mongoose.Schema({
  gmail:
  {
    type: String,
    required: true,
  },
  password:
  {
    type: String,
    required: true,
  }
})

// Define the Book here
const book = new mongoose.Schema({
  ISBN: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  publication_date: {
    type: String,
  },
  genre: {
    type: String,
  },
  image_url_s: {
    type: String,

  },
  image_url_m: {
    type: String,

  },
  image_url_l: {
    type: String,

  },
  frequency: {
    type: Number,

  },
  subject: {
    type: String,

  },
  location_id: {
    type: String,

  },
  price: {
    type: Number,

  }
});

// create the schema of requested_books
const requestedBookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },
  author: {
    type: String,
    required: true
  },
  genre: {
    type: String,
    default: ""
  },
  subject: {
    type: String,
    default: ""
  },
  count: {
    type: Number,
    default: 1,
  },
  customerid:
  {
    type: mongoose.Schema.Types.Mixed,
  }
});

// create the schema for the currorderedbooks

const currentorderedbookschema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    default: ""
  },
  no_Of_Copies_Asked: {
    type: Number,
    default: 1,
  },
  customerid: {
    type: mongoose.Schema.Types.Mixed, // Allows storing any type of data, including objects
    required: true
  },
  ISBN:
  {
    type: String,
    required: true,
  },
  price:
  {
    type: Number,
    required: true,
  }
})
// Get the Schema for the bookssolds
const bookSoldsSchema = new mongoose.Schema({
  ISBN: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  publication_date: {
    type: String,
  },
  genre: {
    type: String,
  },
  image_url_s: {
    type: String,

  },
  image_url_m: {
    type: String,

  },
  image_url_l: {
    type: String,

  },
  frequency: {
    type: Number,
    default: 1,
  },
  subject: {
    type: String,

  },
  price: {
    type: Number,

  },
  details:
  {
    type: mongoose.Schema.Types.Mixed,
  }
})

// Get the models here
const curr_Ordered_books = mongoose.model("currorderedbook", currentorderedbookschema);

const requestedbook = mongoose.model("requestedbook", requestedBookSchema);

const Book = mongoose.model("book", book);

const Customers = mongoose.model("customer", customerSchema);
const Employees = mongoose.model("employees", employeeSchema);
const Owners = mongoose.model("Owners", ownerSchema);
module.exports = { Book, requestedbook, curr_Ordered_books, Customers, Employees, Owners };