import moment from "moment";

export const expireInEspecificMinutes = (minute: number) => {
  return moment().add(minute, "minutes").format();
};

export const getNow = () => {
  return moment().format();
};
