import type { AskSkySkyTransport } from "@workspace/asksky-embed";
import {
  skyGetConversation,
  skyResolve,
  streamSkyMessage,
} from "@/lib/services/sky";

export const appAskSkyTransport: AskSkySkyTransport = {
  skyResolve,
  skyGetConversation,
  streamSkyMessage,
};
