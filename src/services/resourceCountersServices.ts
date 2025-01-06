import { ResourceCountersI } from "../interfaces/resourceCounters";
import { ResourceCountersModel } from "../models/resourceCountersModel";

export class ResourceCountersService {
  static createResourceCounters = async (counterData: ResourceCountersI) => {
    const counter = new ResourceCountersModel(counterData);
    return await counter.save();
  };
}
