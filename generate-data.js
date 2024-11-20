import { faker } from "@faker-js/faker";
import fs from "fs";
faker.location = {
  country: "vietnam",
};

const generateUsers = (amount) => {
  const users = [];
  for (let index = 0; index < amount; index++) {
    const randomUser = {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
    };
    users.push(randomUser);
  }
  return users;
};

const generateDate = () => {
  const users = generateUsers(10);
  const db = {
    users: users,
  };
  fs.writeFileSync("db.json", JSON.stringify(db), () => {
    console.log("save tp database success");
  });
};

generateDate();
