import { NextResponse } from "next/server";
import { confirmOrder } from "@/modules/ordering/application/confirm-order";
import {
  OrderRequestError,
  parseOrderRequest,
} from "@/modules/ordering/domain/order-request";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await confirmOrder(parseOrderRequest(body));
    return NextResponse.json(result, { status: 201 });
  } catch (reason) {
    if (reason instanceof OrderRequestError) {
      return NextResponse.json(
        { error: reason.message },
        { status: reason.status },
      );
    }
    console.error("Falha ao confirmar pedido", reason);
    return NextResponse.json(
      { error: "Não foi possível confirmar o pedido. Tente novamente." },
      { status: 500 },
    );
  }
}
