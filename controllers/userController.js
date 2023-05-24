const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = express();

const User = require("../schemas/userSchema");
const recordSchema = require("../schemas/recordSchema");
const { fetchStudentRecords } = require("../repositories/userRepository");

const { ObjectId } = mongoose.Types;
/**
    role: String <enum  ["student", "admin", "superadmin"]>
    firstName: String,
    lastName: String,
    middleName: String (Optional)
    gender: boolean,
    password: String,
    schoolId: String
    age: Number,
    log: [{
            user: id,
            detail: String,
    }]
 */
const register = async (req, res) => {
  const params = req.body;
  try {
    const schoolId = await User.findOne({ schoolId: params.schoolId });
    if (schoolId) {
      return res.status(401).send({
        message:
          "An account with the same School ID already exist and is not yet approved. Please contact admin for account approval.",
      });
    } else {
      try {
        const hashedPassword = await bcrypt.hash(params.password, 10);
        const dbUser = new User({
          firstName: params.firstName,
          lastName: params.lastName,
          middleName: params.middleName !== undefined ? params.middleName : "",
          schoolId: params.schoolId,
          email: params.email,
          password: hashedPassword,
          gender: params.gender,
          role: params.role,
          age: params.age,
          status: "pending",
        });
        dbUser.save(async (err, room) => {
          if (err) {
            res.status(401).send({ message: "Error", error: err.message });
          } else {
            room.log.push({
              user: mongoose.Types.ObjectId(room.id),
              detail: "Created by " + room.firstName + ", " + room.lastName,
            });
            room.save(async (err, data) => {
              if (err) {
                res.status(401).send({ message: "Error", error: err.message });
              } else {
                data.password = undefined;
                res.status(201).send({ message: "Success", data: data });
              }
            });
          }
        });
      } catch (err) {
        res.status(400).send({ message: "Error", error: err });
      }
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};
const login = async (req, res) => {
  const userLoggingIn = req.body;
  try {
    User.findOne({ schoolId: userLoggingIn.schoolId }).then((dbUser) => {
      console.log(userLoggingIn);
      if (dbUser == null) {
        return res
          .status(400)
          .send({ message: "Incorrect School Id or Password" });
      } else {
        bcrypt
          .compare(userLoggingIn.password, dbUser.password)
          .then((isMatch) => {
            if (isMatch) {
              if (dbUser.status === "approved") {
                const payload = {
                  id: dbUser._id,
                  firstName: dbUser.firstName,
                  middleName: dbUser.middleName,
                  lastName: dbUser.lastName,
                  role: dbUser.role,
                  gender: dbUser.gender,
                  status: dbUser.status,
                  age: dbUser.age,
                  schoolId: dbUser.schoolId,
                };
                jwt.sign(
                  payload,
                  process.env.JWT_SECRET,
                  { expiresIn: 86400 },
                  (err, token) => {
                    if (err) {
                      res.send({ message: err });
                    } else {
                      res.status(201).send({
                        message: "Success",
                        token: "Bearer " + token,
                      });
                    }
                  }
                );
              } else {
                return res.status(400).send({
                  message:
                    "This account is not approved or not yet registered. Please contact admin for account approval.",
                });
              }
            } else {
              return res
                .status(400)
                .send({ message: "Invalid schoolId or Password" });
            }
          })
          .catch((err) => {
            return res
              .status(400)
              .send({ message: "Invalid schoolId or Password", error: err });
          });
      }
    });
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};
const getUser = async (req, res, next) => {
  const userToGet = req.query;
  try {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      User.where(userToGet)
        .populate({
          path: "log.user",
          select: "firstname lastName",
        })
        .exec(async (err, data) => {
          if (err) {
            res.status(400).send({ message: "Error", error: err.message });
          } else {
            data.forEach((element) => {
              element.password = undefined;
            });
            res.status(200).send({ message: "Success", data: data });
          }
        });
    } else {
      await User.where(userToGet)
        .select(["firstName", "lastName"])
        .then((data) => {
          res.status(201).send({ message: "Success", data: data });
        });
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};
const updateUser = async (req, res, next) => {
  try {
    const userToBeUpdate = req.body;
    //para ine makita kun nanu an guinBago
    const doChangeschoolId =
      userToBeUpdate.schoolId === undefined ? "" : "Update schoolId, ";
    const doChageGender =
      userToBeUpdate.gender === undefined ? "" : "Update Gender, ";
    const doChageAge = userToBeUpdate.age === undefined ? "" : "Update Age, ";
    const doChangeRole =
      userToBeUpdate.role === undefined ? "" : "Update Role, ";
    const doChangeFirstName =
      userToBeUpdate.firstName === undefined ? "" : "Update First Name, ";
    const doChangeLastName =
      userToBeUpdate.lastName === undefined ? "" : "Update Last Name, ";
    const doChangeMiddleName =
      userToBeUpdate.middleName === undefined ? "" : "Update Middle Name, ";
    const doChangePassword =
      userToBeUpdate.password === undefined ? "" : "Update Password, ";
    const doChangeStatus =
      userToBeUpdate.status === undefined ? "" : "Update Status, ";
    //Kun an nagUUpdate ngane iba na tawo dapat undefined ine, otherwise an iya la sarili an pwede maUpdate
    if (userToBeUpdate._id !== undefined) {
      let user = await User.findById(
        mongoose.Types.ObjectId(userToBeUpdate._id)
      );
      let havePermission = false;
      if (!user) {
        res.status(400).send({ message: "User not Found" });
      } else if (
        user.role === "student" &&
        (req.user.role === "admin" || req.user.role === "superadmin")
      ) {
        havePermission = true;
      } else if (user.role === "admin" && req.user.role === "superadmin") {
        havePermission = true;
      }
      if (havePermission) {
        user.firstName = userToBeUpdate.firstName
          ? userToBeUpdate.firstName
          : user.firstName;
        user.lastName = userToBeUpdate.lastName
          ? userToBeUpdate.lastName
          : user.lastName;
        user.middleName = userToBeUpdate.middleName
          ? userToBeUpdate.middleName
          : user.middleName;
        user.gender = userToBeUpdate.gender
          ? userToBeUpdate.gender
          : user.gender;
        user.age = userToBeUpdate.age ? userToBeUpdate.age : user.age;
        user.schoolId = userToBeUpdate.schoolId
          ? userToBeUpdate.schoolId
          : user.schoolId;
        user.role = userToBeUpdate.role ? userToBeUpdate.role : user.role;
        user.status = userToBeUpdate.status
          ? userToBeUpdate.status
          : user.status;

        if (!(doChangePassword === "")) {
          const hashedPassword = await bcrypt.hash(userToBeUpdate.password, 10);
          user.password = hashedPassword;
        }
        user.log.push({
          user: mongoose.Types.ObjectId(req.user.id),
          detail:
            doChangePassword +
            doChangeschoolId +
            doChangeStatus +
            doChageAge +
            doChangeRole +
            doChangeFirstName +
            doChangeLastName +
            doChangeMiddleName +
            doChangeRole +
            doChageGender,
        });
        await user.save(async (err, data) => {
          if (err) {
            res.status(400).send({ message: "Error", error: err.message });
          } else {
            data.password = undefined;
            res.status(200).send({ message: "Success", data: data });
          }
        });
      } else {
        res.status(400).send({ message: "Access Denied" });
      }
    } else {
      const user = await User.findById(req.user.id);
      user.firstName = userToBeUpdate.firstName
        ? userToBeUpdate.firstName
        : user.firstName;
      user.lastName = userToBeUpdate.lastName
        ? userToBeUpdate.lastName
        : user.lastName;
      user.middleName = userToBeUpdate.middleName
        ? userToBeUpdate.middleName
        : user.middleName;
      user.gender = userToBeUpdate.gender ? userToBeUpdate.gender : user.gender;
      user.age = userToBeUpdate.age ? userToBeUpdate.age : user.age;
      user.schoolId = userToBeUpdate.schoolId
        ? userToBeUpdate.schoolId
        : user.schoolId;
      user.role = userToBeUpdate.role ? userToBeUpdate.role : user.role;
      if (doChangePassword) {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        user.password = hashedPassword;
      }
      user.log.push({
        user: mongoose.Types.ObjectId(req.user.id),
        detail:
          doChangeschoolId +
          doChangeRole +
          doChageAge +
          doChangeFirstName +
          doChangeLastName +
          doChageGender,
      });
      await user.save(async (err, data) => {
        if (err) {
          res.status(400).send({ message: "Error", error: err.message });
        } else {
          data.password = undefined;
          res.status(200).send({ message: "Success", data: data });
        }
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};

const deleteUser = async (req, res, next) => {
  const params = req.body;
  try {
    let user = await User.findOne({ _id: mongoose.Types.ObjectId(params._id) });
    //   console.log(user);
    let havePermission = false;
    if (!user) {
      res.status(400).send({ message: "User not Found" });
    } else if (
      user.role === "student" &&
      (req.user.role === "admin" || req.user.role === "superadmin")
    ) {
      havePermission = true;
    } else if (user.role === "admin" && req.user.role === "superadmin") {
      havePermission = true;
    }
    if (havePermission) {
      const result = await User.deleteOne({
        _id: mongoose.Types.ObjectId(params._id),
      });
      if (result.deletedCount === 1) {
        //Insert Log
        let admin = await User.findById(mongoose.Types.ObjectId(req.user.id));
        admin.log.push({
          user: mongoose.Types.ObjectId(req.user.id),
          detail: "Delete Student " + user.lastName + ", " + user.firstName,
        });
        await admin.save();
        res.status(200).send({ message: "Success", user: result.deletedCount });
      } else {
        res.status(400).send({ message: "Something Went Wrong" });
      }
    } else {
      res.status(401).json({ message: "Access Denied" });
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};
const getNotifications = async (req, res) => {
  try {
    let users = await User.find({ status: "pending" });
    if (users) {
      res.status(200).send({ message: "Success", data: users });
    }
  } catch (error) {
    console.log("NOTIF ERR: ", error);
    res.status(400).send({ message: "Notification Error" });
  }
};
const approveUser = async (req, res) => {
  try {
    if (req.user.role === "admin" || req.user.role == "superadmin") {
      let data = req.body;
      await User.findOneAndUpdate(
        {
          _id: ObjectId(data._id),
        },
        {
          status: "approved",
        }
      );
      return res.status(200).send({ message: "User approved successfully" });
    } else {
      return res.status(401).send({ message: "User approval denied" });
    }
  } catch (error) {
    console.log("USER APPROVAL ERR: ", error);
    res.status(400).send({ message: "User approval error" });
  }
};
const approveAllUser = async (req, res) => {
  try {
    if (req.user.role === "admin" || req.user.role == "superadmin") {
      await User.updateMany(
        {
          status: "pending",
        },
        {
          $set: {
            status: "approved",
          },
        }
      );
      res.status(200).send({ message: "Success" });
    } else {
      res.status(401).send({ message: "Operation Denied" });
    }
  } catch (error) {
    res.status(400).send({ message: "Something went wrong", err: error });
  }
};
const rejectAllUsers = async (req, res) => {
  try {
    if (req.user.role === "admin" || req.user.role == "superadmin") {
      await User.updateMany(
        {
          status: "pending",
        },
        {
          $set: {
            status: "rejected",
          },
        }
      );
      return res
        .status(200)
        .send({ message: "All users rejected successfully" });
    } else {
      res.status(401).send({ message: "Access Denied" });
    }
  } catch (error) {
    res.status(400).send({ message: "Something went wrong", err: error });
  }
};

const fetchAllStudents = async (req, res) => {
  try {
    const records = await fetchStudentRecords(req.query.year);
    res.status(200).send({ message: "Success", data: records });
  } catch (error) {
    res.status(400).send({ message: "Something went wrong", err: error });
  }
};

const fetchRejectedStudents = async (req, res) => {
  try {
    const users = await User.where({ status: "rejected" });
    return res.status(200).send({ message: "Success", data: users });
  } catch (error) {
    return res
      .status(400)
      .send({ message: "Something went wrong", err: error });
  }
};

const fetchPendingStudents = async (req, res) => {
  try {
    const users = await User.where({ status: "pending" });
    return res.status(200).send({ message: "Success", data: users });
  } catch (error) {
    return res
      .status(400)
      .send({ message: "Something went wrong", err: error });
  }
};
const changePassword = async (req, res) => {
  try {
    const params = req.body;
    const user = await User.findOne({
      email: params.email,
      schoolId: params.schoolId,
    });
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    } else {
      const hashedPassword = await bcrypt.hash(params.password, 10);
      user.password = hashedPassword;
      await user.save();
      return res.status(200).send({ message: "Success" });
    }
  } catch (error) {
    res.status(400).send({ message: "Something went wrong", err: error });
  }
};

const fetchAllUsers = async (req, res) => {
  try {
    const result = await User.find({ role: { $in: ["admin", "student"] } });
    res.status(200).send({ message: "Success", data: result });
  } catch (error) {
    res
      .status(400)
      .send({ message: "Something went wrong", error: error.message });
  }
};

const checkEmailExist = async (req, res) => {
  try {
    const { schoolId, email } = req.query;
    const data = await User.findOne({
      schoolId: schoolId,
      email: email,
    });
    if (data) {
      return res.status(200).send({ message: "Success", isActive: true });
    } else {
      return res.status(200).send({ message: "Success", isActive: false });
    }
  } catch (error) {
    res
      .status(400)
      .send({ message: "Something went wrong", error: error.message });
  }
};

exports.register = register;
exports.login = login;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
exports.getUser = getUser;
exports.checkEmailExist = checkEmailExist;
exports.fetchPendingStudents = fetchPendingStudents;
exports.fetchRejectedStudents = fetchRejectedStudents;
exports.approveUser = approveUser;
exports.getNotifications = getNotifications;
exports.rejectAllUsers = rejectAllUsers;
exports.approveAllUser = approveAllUser;
exports.fetchAllStudents = fetchAllStudents;
exports.changePassword = changePassword;
exports.fetchAllUsers = fetchAllUsers;
