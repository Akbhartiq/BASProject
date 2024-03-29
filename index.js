// Global variables to track who has logged in
var loggedinCredentials = {}
// Import node-fetch using dynamic import
const fetch = import('node-fetch');
// importing the required modules
const express = require("express");
const path = require('path');
const bodyParser = require('body-parser');
// const signinrouter = require("./routes/signin.js"); // Import the router directly
const { connect } = require("./connect.js");
const session = require('express-session'); // Import express-session module
// connect("mongodb://127.0.0.1:27017/accounts").then(() => console.log("mongodb is connected"));
// const signuprouter = require("./routes/signup.js");
const { Book, requestedbook, curr_Ordered_books, Customers, Employees, Owners, BookSolds } = require("./models/data.js");
console.log("HI");
// console.log(requestedbook);
// console.log(Book);
const { info, log } = require("console");

// get the mongoose
const mongoose = require('mongoose');

// Get the MonogStore For the Session Management
const MongoStore = require("connect-mongo");

// establish the connection
mongoose.connect('mongodb://localhost/accounts', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
});



// create the app instance
const app = express();
const PORT = 5000;


// init the session management
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost/accounts',
        collectionName: 'sessions'
    })
}))

// middleware
app.use(bodyParser.json());

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
// app.post("/signin", async (req, res) => {
//     console.log("I am here int the index/signin!");
//     const id = req.body;
//     if (id.gmail && id.password) {
//         const user = await Data.findOne({ gmail: id.gmail });

//         if (user) {
//             if (id.password === user.password) {

//                 loggedinCredentials.emailOfUser = id.gmail;
//                 loggedinCredentials.passwordOfUser = id.password;
//                 if (user.cat === "c") {

//                     loggedinCredentials.typeOfUser = 'c';
//                     console.log("Yes i am done , i am here!");
//                     let result = [];
//                     for (values in list) {
//                         let results_book = await Book.find({ subject: list[values] }).limit(5);

//                         result.push(results_book);

//                     }
//                     return res.render("home", { create: id.gmail, result: result, list: list });
//                 }
//                 else if (user.cat === "o") {
//                     loggedinCredentials.typeOfUser = 'o';
//                     return res.redirect("/owner");
//                 }
//                 else {
//                     console.log("I am at the employee page!");
//                     loggedinCredentials.typeOfUser = 'e';
//                     try {
//                         loggedinCredentials.typeOfUser = 'e';
//                         return res.render("employee_page");
//                     }
//                     catch (error) {
//                         console.log("Let's see the error!");
//                         console.error("Error rendering employee_page:", error);
//                         // Handle the error appropriately, such as rendering an error page or sending an error response
//                         // return res.status(500).send("Internal Server Error");
//                     }
//                     // return res.render("employee_page");
//                 }
//             }
//             return res.render("signin", { same: "no" }); // Pass local to template
//         }

//         return res.render("signin", { same: "ok" });
//     }
// });

app.get("/invokesign", async (req, res) => {
    console.log(req.query);

    try {
        await SIGNIN(req.query.gmail, req.query.password, res);
    } catch (error) {
        console.error("Error during sign-in:", error);
        // Handle the error appropriately
        res.status(500).send("Internal Server Error");
    }
});

async function SIGNIN(valGmail, valPassword, res) {
    // console.log("I am here int the index/signin!");
    if (valGmail && valPassword) {
        console.log(`valGmail:${valGmail} and valPassword:${valPassword}`);
        // check if the user is present in the Customers Section
        let user = await Customers.findOne({ gmail: valGmail });
        if (!user) {
            // check if is present in the Employees Section
            user = await Employees.findOne({ gmail: valGmail });
            if (!user) {
                user = await Owners.findOne({ gmail: valGmail });
                if (!user) {
                    // Invalid Credentials
                    res.render("signin", { same: "ok" });

                }
                else {
                    // Owner
                    loggedinCredentials.emailOfUser = valGmail;
                    loggedinCredentials.passwordOfUser = valPassword;
                    loggedinCredentials.typeOfUser = 'o';
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
        //     if (user && valPassword === user.password) {
        //         loggedinCredentials.emailOfUser = valGmail;
        //         loggedinCredentials.passwordOfUser = valPassword;

        //         if (user.cat === "c") {

        //             console.log("Yes i am done , i am here!");
        //             let result = [];
        //             for (values in list) {
        //                 let results_book = await Book.find({ subject: list[values] }).limit(5);
        //                 result.push(results_book);
        //             }
        //             res.render("home", { create: valGmail, result: result, list: list });
        //         } else if (user.cat === "o") {
        //             loggedinCredentials.typeOfUser = 'o';
        //             res.redirect("/owner");
        //         } else {
        //             console.log("I am at the employee page!");
        //             loggedinCredentials.typeOfUser = 'e';
        //             // search all the curr_ordered books and pass it to the employee page
        //             const book = await curr_Ordered_books.find();
        //             // console.log(`From the index.js file ${book[0].price}`);
        //             res.render("employee_page", { books: book });
        //         }
        //     } else {
        //         res.render("signin", { same: "no" });
        //     }
        // } else {
        //     res.render("signin", { same: "ok" });
        // }
    }
}

// get the owner page
app.get("/owner", async (req, res) => {
    console.log("not ok");

    return res.render("owner")
});
// get the employee page
app.get("/employee", async (req, res) => {
    console.log(typeof (Customers));
    // get the curr_ordered_books
    const book = await curr_Ordered_books.find();
    console.log(typeof (book));
    // get id and gmail
    return res.render("employee_page", { books: book, empGmail: loggedinCredentials.emailOfUser, empPassword: loggedinCredentials.passwordOfUser, Employees, Book });
})

// app.post("/owner", async (req, res) => {
//     const id = req.body;
//     if (id.gmail && id.password) {
//         const user = await Data.findOne({ gmail: id.gmail });

//         if (!user) {
//             const result = await Data.create({ gmail: id.gmail, password: id.password, cat: "e" });
//             console.log(result);
//             return res.redirect("/owner")
//         }
//     }
//     if (id.gmail1) {
//         const user = await Data.findOneAndDelete({ gmail: id.gmail1 });
//         return res.redirect("/owner");
//     }
//     if (id.book) {

//     }
// });
app.get("/allbooks", async (req, res) => {
    const subject = req.query.subject;
    console.log(subject);
    let result = await Book.find({ subject: subject });

    console.log(result);

    return res.render("allbooks", { subject: subject, result: result })
});
app.get("/singlebook", async (req, res) => {
    const book = req.query.book;
    console.log(book);
});

// define the search method
// define the search method
app.get("/search", async (req, res) => {

    // get the title name or the author name of the book 
    let inputval = req.query.query;
    // console.log("_________________________________________________________________________\n");
    // console.log(book_title_name);
    // console.log("_________________________________________________________________________\n");
    // Find the books now
    // res.send("I have found the books!");
    // try {
    // get the search Type
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
        // create one more page that asks the user details of the books
        // return res.render("askDetails");
        if (search_basis == "title")
            return res.render("confirmRequest", { title: inputval });
        else
            return res.render("confirmRequest", { author: inputval });
    }
    // }
    // catch (error) {
    //     console.log("Some error is there!");
    //     console.log(error);
    //     return res.send("I couldn't get your books because of some error!");
    // }

    // render the details to an .ejs file
    // console.log("_________________________________________________________________________\n");
    // console.log(book_title_name);
    // console.log("_________________________________________________________________________\n");
    else {
        return res.render("singlebook", { books: book_details });
    }
    // return res.send("Hello , I have found your book!");
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
    console.log("Done");
    console.log("HI");
    res.sendStatus(200);

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

app.listen(PORT, () => console.log("server started"));