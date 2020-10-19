mongo = new Mongo("localhost");
expenseTrackerDB = mongo.getDB('vueExpenseTracker');
expenseTrackerDB.createCollection("categories");
expenseTrackerDB.createCollection("expenses");
expenseTrackerDB.createCollection("imports");
expenseTrackerDB.createCollection('users');
