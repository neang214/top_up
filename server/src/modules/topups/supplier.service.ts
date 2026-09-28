export type SupplierOrderStatus =
    | "COMPLETED"
    | "PROCESSING"
    | "FAILED";

export const createSupplierOrder = async (
    productId: string,
    playerId: string,
    zoneId: string | undefined,
    idempotencyKey: string
) => {
    console.log("Simulating supplier order:", {
        productId,
        playerId,
        zoneId,
        idempotencyKey,
    });

    await new Promise((resolve) =>
        setTimeout(resolve, 1000)
    );

    return {
        orderId: `SUP-${idempotencyKey}`,
        status: "COMPLETED" as SupplierOrderStatus,
    };
};