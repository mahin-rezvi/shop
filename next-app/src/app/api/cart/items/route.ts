import { NextRequest } from "next/server";
import { POST as addToCart } from "../route";

export async function POST(request: NextRequest) {
  return addToCart(request);
}
