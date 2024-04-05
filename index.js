// Global variables to track who has logged in
var loggedinCredentials = {}
// Import node-fetch using dynamic import
const fetch = import('node-fetch');
// importing the required modules
const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session')

// get the  schema here
const { Book, requestedbook, curr_Ordered_books, Customers, Employees, Owners, BookSolds } = require("./models/data.js");

// get the mongoose
const mongoose = require('mongoose');

// Get the MonogStore For the Session Management
const MongoStore = require("connect-mongo");

// establish the connection
mongoose.connect('mongodb://localhost/accounts', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
});


// 5th April
// Define a Mongoose schema
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});

// Create a Mongoose model
const user = mongoose.model('User', UserSchema);

// create the app instance
const app = express();
const PORT = 5000;


// init the session management
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost/accounts',
        collectionName: 'sessions'
    })
}))

// middleware
app.use(bodyParser.json());


// 5th April 19
// Middleware to check if user is authenticated
const isAuthenticated = async (req, res, next) => {
    console.log("Inside the isAuth function!");
    console.log(req.session.user)
    if (req.session.user) {
        console.log("I am inside the authentication thing");
        console.log(`${req.session.user}`);
        console.log(`${req.session.user.username}`)
        console.log(`${req.session.user.email}`)
        console.log(`${req.session.user.password}`)
        next(); // User is authenticated, proceed to the next middleware/route handler
    } else {
        res.redirect('/login'); // User is not authenticated, redirect to login page
    }
};




// get the subject list
let list = ["Fictional", "Health", "Mystery", "Thriller", "History", "CS"];
app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static("views"));

app.get("/", async (req, res) => {
    let result = [];
    for (values in list) {
        let results_book = await Book.find({ subject: list[values] }).limit(5);

        result.push(results_book);

    }
    return res.render("home", { result: result, list: list });
});

// build the signin api (in get format)
app.get("/login", async (req, res) => {

    return res.render("signin");
});

// build the signup api (in get format:get the data from the front-end)
app.get("/signup", (req, res) => {
    return res.render("signup");
});

// build the signup api (in post format:post the data to the back-end)
app.post("/signup", async (req, res) => {
    const id = req.body;
    console.log(req.body);
    if (id.gmail && id.password) {
        // check if the the requested gmail already exists
        let user = await Customers.findOne({ gmail: id.gmail });
        if (!user) {
            // User Doesn Not exist in Customer Section , then find in Employee section
            user = await Employees.findOne({ gmail: id.gmail });
            if (!user) {
                user = await Employees.findOne({ gmail: id.gmail });
            }
        }

        // if the requeste gmail is not present any section 
        if (!user) {
            const result1 = await Customers.create({ gmail: id.gmail, password: id.password });
            loggedinCredentials.emailOfUser = id.gmail;
            loggedinCredentials.passwordOfUser = id.password;
            loggedinCredentials.typeOfUser = 'c';
            let result = [];
            for (values in list) {
                let results_book = await Book.find({ subject: list[values] }).limit(5);

                result.push(results_book);

            }
            return res.render("home", { create: id.gmail, list: list, result: result }); // Pass local to template
        }

        return res.render("signup", { same: "ok" });
    }
});
// get the about api
app.get("/about", async (req, res) => {
    res.render("about");
})
// get the contact api
app.get("/contact", async (req, res) => {
    res.render("contact");
})
app.get("/invokesign", async (req, res) => {
    console.log(req.query);

    try {
        await SIGNIN(req.query.gmail, req.query.password, res, req);
    } catch (error) {
        console.error("Error during sign-in:", error);
        // Handle the error appropriately
        res.status(500).send("Internal Server Error");
    }
});

async function SIGNIN(valGmail, valPassword, res, req) {
    // console.log("I am here int the index/signin!");
    if (valGmail && valPassword) {
        console.log(`valGmail:${valGmail} and valPassword:${valPassword}`);
        // check if the user is present in the Customers Section
        let user = await Customers.findOne({ gmail: valGmail });
        console.log(`User find in singin api is ${user}`);
        if (!user) {
            console.log("I am here!");
            // check if is present in the Employees Section
            user = await Employees.findOne({ gmail: valGmail });
            console.log(`User find in em api is ${user}`);
            if (!user) {
                user = await Owners.findOne({ gmail: valGmail });
                console.log(`User find in owner api is ${user}`);
                if (!user) {
                    console.log('Invalid credentials for the owner!');
                    // Invalid Credentials
                    res.render("signin", { same: "ok" });

                }
                else {
                    // Owner
                    loggedinCredentials.emailOfUser = valGmail;
                    loggedinCredentials.passwordOfUser = valPassword;
                    loggedinCredentials.typeOfUser = 'o';
                    // Set user data in session
                    req.session.user = {
                        username: valGmail,
                        password: valPassword
                    };
                    res.redirect("/owner");
                }
            }
            else {
                // User Can be Employee
                if (valPassword == user.password) {
                    // User is employee
                    loggedinCredentials.emailOfUser = valGmail;
                    loggedinCredentials.passwordOfUser = valPassword;
                    console.log("I am at the employee page!");
                    loggedinCredentials.typeOfUser = 'e';
                    // search all the curr_ordered books and pass it to the employee page
                    res.redirect("/employee");

                }
                else {
                    // Invalid Credentials
                    res.render("signin", { same: "no" });
                }
            }
        }
        else {
            // User Can be customer
            if (valPassword == user.password) {
                // User is the Customer
                loggedinCredentials.emailOfUser = valGmail;
                loggedinCredentials.passwordOfUser = valPassword;
                loggedinCredentials.typeOfUser = 'c';
                let result = [];
                for (values in list) {
                    let results_book = await Book.find({ subject: list[values] }).limit(5);
                    result.push(results_book);
                }
                res.render("home", { create: valGmail, result: result, list: list });
            }
            else {
                // Invalid Credentials
                res.render("signin", { same: "no" });
            }
        }
    }
}

// 5th April codes

// Route to render owner page
app.get("/owner", isAuthenticated, async (req, res) => {
    // Render owner page view using EJS
    console.log("Am i getting triggered!");
    res.render("owner", { message: "" });
});


// api to render the image of single page
app.get("/bookpage", async (req, res) => {
    console.log(req.body);
    console.log(req.query);
    console.log("I am here!");
    // get the book-title here
    const bookTitle = req.query.title;
    // search the book-title here 
    const bookinfo = await Book.find({ title: bookTitle });
    console.log("I am printing the info of the book!");
    console.log(bookinfo);
    console.log("************");
    res.render("singlebook", { books: bookinfo });

})
// get the employee page
app.get("/employee", async (req, res) => {
    console.log(typeof (Customers));
    // get the curr_ordered_books
    const book = await curr_Ordered_books.find();
    console.log(typeof (book));
    // get id and gmail
    return res.render("employee_page", { books: book, empGmail: loggedinCredentials.emailOfUser, empPassword: loggedinCredentials.passwordOfUser, Employees, Book });
})


// api to order all the requested books
app.post("/order-all-books", async (req, res) => {
    // /get all the books from the requestedbooks and push them all to the books section
    let reqbook = await requestedbook.find();
    // push all the book to book section
    let isbnval = 12345687;
    for (let i = 0; i < reqbook.length; i++) {
        // create a book
        Book.create({ title: reqbook[i].title, author: reqbook[i].author, ISBN: toString(isbnval + 1) });
    }
    res.redirect("/owner");
});

// api to see the buisness data
app.get("/view-business-data", async (req, res) => {
    // get the date,month and year
    const date = req.query.date;
    const month = req.query.month;
    const year = req.query.year;

    if (date && month && year) { // If all three are given
        const bookFallenBelowThreshold = await BookSolds.find({ date: date, year: year, month: month }); // Searching with respect to both year, date, and month
        let totalamount = 0;
        bookFallenBelowThreshold.forEach((book, index) => {
            totalamount = totalamount + book.price;
        });


        console.log(bookFallenBelowThreshold);
        res.render("accounts", { books: bookFallenBelowThreshold, total: totalamount });
    } else {
        if (month && year) { // If only month and year are given
            const bookFallenBelowThreshold = await BookSolds.find({ year: year, month: month });
            let totalamount = 0;
            bookFallenBelowThreshold.forEach((book, index) => {
                totalamount = totalamount + book.price;
            });
            console.log(bookFallenBelowThreshold);
            res.render("accounts", { books: bookFallenBelowThreshold, total: totalamount });
        } else {
            if (year) { // If only year is given
                const bookFallenBelowThreshold = await BookSolds.find({ year: year });
                console.log(bookFallenBelowThreshold);
                let totalamount = 0;
                bookFallenBelowThreshold.forEach((book, index) => {
                    totalamount = totalamount + book.price;
                });
                res.render("accounts", { books: bookFallenBelowThreshold, total: totalamount });
            } else { // If neither year, month, nor date are given
                res.redirect("/owner");
            }
        }
    }
});


app.get("/allbooks", async (req, res) => {
    const subject = req.query.subject;
    console.log(subject);
    let result = await Book.find({ subject: subject });

    console.log(result);

    return res.render("allbooks", { create: loggedinCredentials.emailOfUser, subject: subject, result: result })
});
app.get("/singlebook", async (req, res) => {
    const book = req.query.book;
    console.log(book);
});

// define the search method
app.get("/search", async (req, res) => {

    // get the title name or the author name of the book 
    let inputval = req.query.query;
    let search_basis = req.query.searchType;
    console.log(`The query is ${inputval} and the search_basis is ${search_basis}`);
    let book_details = [];//get init with empty string
    if (search_basis == "author") {
        book_details = await Book.find({ author: inputval });
        console.log(`The total number of such books is ${book_details.length}`)
    }
    else {
        book_details = await Book.find({ title: inputval });
    }

    //if book is not available
    if (book_details.length == 0) {
        if (search_basis == "title")
            return res.render("confirmRequest", { title: inputval });
        else
            return res.render("confirmRequest", { author: inputval });
    }
    else {
        return res.render("singlebook", { books: book_details });
    }

});


// create the request(book requst) api (if book is not found in the backend)
app.post("/request", async (req, res) => {
    return res.render("askDetails");
})
// get the function to display the book if it has been found

app.get("/singlebook", async (req, res) => {
    book_name = req.query.book;
    let book_details = await Book.findOne({ title: book_name });
    return res.render("singlebook", { book: book_details })
});

app.post("/singlebook", async (req, res) => {

    return res.redirect("/")
});

// Function to get the ISBN number given the title and the author name
const axios = require('axios');
const { stat } = require('fs');
// const { default: mongoose } = require("mongoose");

async function getISBN(title, author) {
    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: `intitle:${title}+inauthor:${author}`,
                maxResults: 1,
                key: 'YOUR_API_KEY' // Replace with your actual API key
            }
        });

        const book = response.data.items[0];
        const isbn = book.volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13').identifier;

        return isbn;
    } catch (error) {
        console.error('Error fetching ISBN:', error.message);
        return null;
    }
}

// let's write the submitt details api
app.post("/submit_details", async (req, res) => {
    // since we have got the data's for the requested books , now push it to the backe-end database
    const infoOfBook = req.body;
    const titleOfBook = infoOfBook.title;
    const authorOfBook = infoOfBook.author;
    // const isbnOfBook = getISBN(titleOfBook, authorOfBook);
    // const publication_dateOfBook = infoOfBook.publication_date;
    const genre_of_book = infoOfBook.genre;
    const descpOfBook = infoOfBook.description;
    const subOfBook = infoOfBook.subject;
    // find if the request already exists
    const ifalreadyexist = await requestedbook.findOne({ title: titleOfBook });
    if (ifalreadyexist) {
        await requestedbook.updateOne({ title: titleOfBook }, { $inc: { count: 1 } });
    }
    // now push the data to the requested_books collection
    else {
        const new_Requested_book = await requestedbook.create({ title: titleOfBook, author: authorOfBook, genre: genre_of_book, subject: subOfBook });
    }
    res.send("I am  dongin things!");
})

// writing the apis which will be handling the function of the owner
app.get('/view-requested-books', async (req, res) => {
    try {
        // Fetch requested books data from MongoDB
        const books = await requestedbook.find();
        res.render('renderRequestedBooks.ejs', { books });
    } catch (error) {
        console.error('Error fetching requested books:', error);
        res.status(500).send('Internal Server Error');
    }

});

// api's to ignore the book-requests
app.delete('/ignore-book/:bookId', async (req, res) => {
    const bookId = req.params.bookId;
    console.log("I am delete in the index.js file!");
    try {
        // Delete the book document from the database
        await requestedbook.findByIdAndDelete(bookId);
        res.sendStatus(200); // Send success response
    } catch (error) {
        console.error('Error ignoring book:', error);
        res.sendStatus(500); // Send internal server error response
    }
});

// api's to search the book-online
// Define route to handle requests to /book-details



// Update the route handler
app.get('/search-online', async (req, res) => {
    const title = req.query.title;
    const author = req.query.author;
    try {
        // Use node-fetch to make the HTTP request
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${title}+inauthor:${author}`);
        const data = await response.json();
        // Render the book details page
        res.render("showBook", { book: data });
    } catch (error) {
        console.error('Error fetching book details:', error);
        res.status(500).send('Internal Server Error');
    }
});


// get the api to save the data to the backends
app.post("/save_to_currordered_books", async (req, res) => {
    try {
        console.log("Inside the save function!");
        console.log(req.body);
        console.log(req.query);
        console.log(loggedinCredentials);

        // Assuming `loggedinCredentials` contains the ID of the logged-in user

        // Save the data to the curr_ordered_books collection
        await curr_Ordered_books.create({
            title: req.query.title,
            author: req.query.author,
            ISBN: req.query.isbn,
            customerid: loggedinCredentials,
            price: req.query.price
        });

        // Send a success response
        res.sendStatus(200);
    } catch (error) {
        console.error("Error saving data to curr_ordered_books:", error);
        // Send an error response
        res.status(500).send("Error saving data to curr_ordered_books");
    }
});

// Give the get recipt function here
app.get("/get_receipt", async (req, res) => {
    console.log(req.body);
    console.log(req.query);
    res.render("generate_reciept", { title: req.query.title, price: req.query.price, isbn: req.query.isbn, author: req.query.author });
})

// Get the api to check if the book-ordered is issued by the Employee and if it so , then ISBN must be deleted form the Database// Handle request to check if ISBN is deleted
app.get('/check_isbn_deleted', async (req, res) => {
    try {
        // Perform a query to check if the ISBN is deleted from curr_Ordered_books
        // Here you would perform a query to your MongoDB database to check if the ISBN exists in the curr_Ordered_books collection
        console.log(req.query);
        console.log(req.body);
        const isbnExists = await curr_Ordered_books.exists({ ISBN: req.query.isbn });
        console.log(isbnExists);
        console.log(req.query.isbn);
        // Send the response indicating whether the ISBN is deleted
        res.json({ isDeleted: !isbnExists }); // If ISBN does not exist, it's considered deleted
    } catch (error) {
        console.error('Error checking ISBN:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// getall_Books api for the employee page(curr_ordered books)
// Define routes
app.get('/get_all_books', async (req, res) => {
    try {
        const books = await curr_Ordered_books.find(); // Fetch all books from the database
        console.log(res.json(books));
        return res.json(books); // Send the books as JSON response
    } catch (err) {
        console.error('Error fetching books:', err);
        res.status(500).send('Internal Server Error');
    }
});


// function to add the employee
app.post("/add-employee", async (req, res) => {

    // let's create the user in the data's collection of the mongodb
    console.log(req.body);
    const emId = req.body.email;
    const emPassword = req.body.password;

    // first search if someone with same id exists in Customer section, Employee or the owner section
    let ifsameid = await Customers.findOne({ gmail: emId });
    if (!ifsameid) {
        ifsameid = await Employees.findOne({ gmail: emId });
        // check if it present in the Owner Section
        if (!ifsameid) {
            ifsameid = await Employees.findOne({ gmail: emId });
        }
    }
    // console.log(ifsameid);
    // if (!ifsameid) {
    //     await Employees.create({ gmail: emId, password: emPassword });
    //     // alert("Employee added SuccessFully to the WorkForce!");
    //     res.redirect("/owner");
    // }
    // else {
    //     // alert(`This gmail Id : ${emId} already exists!`);
    //     res.redirect("owner");
    // }
    if (ifsameid) {
        res.render("owner", { message: "This email ID already exists!" });
    } else {
        await Employees.create({ gmail: emId, password: emPassword });
        res.render("owner", { message: "Employee added successfully!" });
    }

})
// Get the api for the remove-employee
app.post("/remove-employee", async (req, res) => {
    // find and delete the employee from the database
    try {
        await Employees.findOneAndDelete({ gmail: req.body.email });
        // redirect the owner to owner page again
        res.render("owner", { message: "Employee removed successfully!" });
    }
    catch (error) {
        res.render("owner", { message: "Error Employee successfully!" });
    }
}
)

// Get the last 10 days statistics
app.get("/view-last-10-days-stats", async (req, res) => {
    try {
        // Get the current date
        const currentDate = new Date();

        // Calculate the date 10 days ago
        const startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - 10);

        // Find books sold within the last 10 days
        const soldbooks = await BookSolds.find();

        // Render the "lastendays.ejs" page with the soldbooks data
        return res.render("lastendays", { soldbooks });
    } catch (error) {
        console.error("Error fetching last 10 days statistics:", error);
        // Handle error and render an error page if needed
        return res.render("error", { error });
    }
})

// API TO SEE THE BOOKS BELOW THRESOLD
app.get("/view-books-below-threshold", async (req, res) => {
    // create a json object array
    let BookBelowThresold = [];
    // get the thresold value
    let thresholdvalue = req.query.threshold;
    console.log(thresholdvalue);
    // now get the books in the Books that have fallen below the thresold
    const bookFallenBelowThreshold = await Book.find({ frequency: { $lt: thresholdvalue } });
    // console.log(bookFallenBelowThreshold.length);
    res.render("belowthresold", { books: bookFallenBelowThreshold, val: thresholdvalue });

})

// Delete book by ISBN
app.delete('/delete-book/:isbn', async (req, res) => {
    const isbn = req.params.isbn;
    console.log("Here and There!");
    console.log(isbn);
    try {
        // Find the book in curr_requested_books collection and delete it
        let statusVal = await curr_Ordered_books.findOneAndDelete({ ISBN: isbn });
        if (statusVal) {
            // Book has been sold 
            // Get the CurrentDate
            const currentDate = new Date();
            const curryear = currentDate.getFullYear();
            const currmonth = currentDate.getMonth();
            const currdate = currentDate.getDate();
            const currhour = currentDate.getHours();
            // Add the books to the sold history
            await BookSolds.create({ title: statusVal.title, ISBN: statusVal.ISBN, author: statusVal.author, frequency: statusVal.no_Of_Copies_Asked, details: { Buyer: statusVal.customerid.emailOfUser, Seller: loggedinCredentials.emailOfUser }, price: statusVal.price, currdate: currentDate.toString(), year: curryear, month: currmonth, date: currdate, hours: currhour });
            // Push to book to the Customer Database
            await Customers.findOneAndUpdate({ gmail: statusVal.customerid.emailOfUser }, { $push: { bookspurchased: { Date: currentDate.toString(), seller: loggedinCredentials.emailOfUser, copies: statusVal.no_Of_Copies_Asked, price: statusVal.price, ISBN: statusVal.ISBN } } });
            // Push the book sold to the list of the Employees
            await Employees.findOneAndUpdate({ gmail: statusVal.customerid.emailOfUser }, { $push: { booksSold: { Date: currdate.toString(), buyer: statusVal.customerid.emailOfUser, copies: statusVal.no_Of_Copies_Asked, price: statusVal.price, ISBN: statusVal.ISBN } } });
            res.sendStatus(200);
        }
        else {
            // console.error('Error deleting book by ISBN:', error);
            res.sendStatus(500);
        }
        // res.sendStatus(200); // Send success response
    } catch (error) {
        console.error('Error deleting book by ISBN:', error);
        // res.sendStatus(500); // Send internal server error response
    }
});

// api to order the books
app.post("/order_book", async (req, res) => {
    // confirm the fetch request
    // console.log(req.body);
    // let's order the book
    console.log("_____________________");
    console.log(req.body.title);
    console.log("_______________________");
    // console.log(Book.find({ title: req.body.title }));
    await Book.findOneAndUpdate({ title: req.body.title }, { $inc: { frequency: parseInt(req.body.quantity) } }, { new: true });
    console.log("Done");
    res.sendStatus(200);

})
// api to order the requested books
app.post("/order_req_book", async (req, res) => {
    // confirm the fetch request
    // console.log(req.body);
    // let's order the book
    console.log("_____________________");
    console.log(req.body.title);
    console.log("_______________________");
    // console.log(Book.find({ title: req.body.title }));
    await Book.create({ title: req.body.title, author: req.body.author, ISBN: req.body.ISBN, price: req.body.price, frequency: req.body.quantity });
    res.sendStatus(200);

})

// api to add the book-requested by owner or employee
app.post("/book-request",async(req,res)=>{

})

// api to inspect the employee
app.get("/inspectem", async (req, res) => {

    console.log(req.body);
    console.log(req.query);
    // now perform the operation
    const employee = await Employees.find({ gmail: req.query.employee_email });
    console.log(`I am inside the employee section!`);
    console.log(employee);
    if (employee) {
        res.render("showemp", { employee: employee });
    }
    else {
        res.render("owner", { message: "No Such Employee Exist!" });
    }
}
)

// api to inspect the customer
app.get("/inspectcs", async (req, res) => {

    console.log(req.body);
    console.log(req.query);
    // now perform the operation
    const customer = await Customers.find({ gmail: req.query.customer_email });
    console.log(`I am inside the employee section!`);
    console.log(customer);
    if (customer) {
        res.render("showcs", { customer: customer });
    }
    else {
        res.render("owner", { message: "No Such Employee Exist!" });
    }
}
)

app.listen(PORT, async () => console.log("server started"));