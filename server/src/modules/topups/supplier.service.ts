export type SupplierOrderStatus =
    | "COMPLETED"
    | "PROCESSING"
    | "FAILED";

export const createSupplierOrder = async (
    supplierPackageId: string,
    playerId: string,
    zoneId: string | undefined,
    idempotencyKey: string
) => {
    console.log("Simulating supplier order:", {
        supplierPackageId,
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