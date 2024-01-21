const { initializeApp } = require("firebase/app");
const {
  getDatabase,
  ref,
  push,
  set,
  get,
  remove,
  child,
} = require("firebase/database");

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object

// const firebaseConfig = {
//   apiKey: "AIzaSyAwB1flbXuikcIAfU2dlwmugoqJMHpuRro",
//   authDomain: "gradpro-f889f.firebaseapp.com",
//   projectId: "gradpro-f889f",
//   storageBucket: "gradpro-f889f.appspot.com",
//   messagingSenderId: "563944919240",
//   appId: "1:563944919240:web:3871ab4184a0c50b5915fd",
//   measurementId: "G-L8LGJ7GV90",
//   databaseURL: "https://gradpro-f889f-default-rtdb.firebaseio.com/",
// };

const firebaseConfig = {
  apiKey: "AIzaSyANpB-phMWd34G-znpF_pHaR0JvDEb2ssQ",
  authDomain: "gradpro-15169.firebaseapp.com",
  databaseURL: "https://gradpro-15169-default-rtdb.firebaseio.com",
  projectId: "gradpro-15169",
  storageBucket: "gradpro-15169.appspot.com",
  messagingSenderId: "517573768918",
  appId: "1:517573768918:web:577775ed5b4148b9aefb77"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

function writeNotification(from, to, details) {
  const newRequestRef = push(ref(database, "requests"));

  set(newRequestRef, {
    from: from,
    to: to,
    details: details,
  });
}

async function readNotifications(destination) {
  try {
    const requestsRef = ref(database, "requests");
    const snapshot = await get(requestsRef);
    const result = [];

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        if (request.to === destination) {
          result.push(request);
        }
      });
      return result;
    } else {
      console.log("No matching data found.");
      return [];
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

async function deleteRow(destination) {
  try {
    const requestsRef = ref(database, "requests");
    const snapshot = await get(requestsRef);

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        if (request.to === destination) {
          const keyToDelete = childSnapshot.key;
          remove(child(requestsRef, keyToDelete))
            .then(() =>
              console.log(
                `Row with 'to' value ${destination} deleted successfully.`
              )
            )
            .catch((error) => console.error("Error deleting row:", error));
        }
      });
    } else {
      console.log("No matching data found.");
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

async function deleteRequest(fromID) {
  try {
    const requestsRef = ref(database, "requests");
    const snapshot = await get(requestsRef);

    if (snapshot.exists()) {
      snapshot.forEach((childSnapshot) => {
        const request = childSnapshot.val();
        if (request.from === fromID) {
          const keyToDelete = childSnapshot.key;
          remove(child(requestsRef, keyToDelete))
            .then(() =>
              console.log(
                `Row with 'to' value ${fromID} deleted successfully.`
              )
            )
            .catch((error) => console.error("Error deleting row:", error));
        }
      });
    } else {
      console.log("No matching data found.");
    }
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
}

exports.writeNotification = writeNotification;
exports.deleteRequest = deleteRequest;
