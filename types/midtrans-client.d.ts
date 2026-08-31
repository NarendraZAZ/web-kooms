declare module "midtrans-client" {
  interface SnapOptions {
    isProduction: boolean;
    serverKey: string;
    clientKey: string;
  }

  interface TransactionDetails {
    transaction_details: {
      order_id: string;
      gross_amount: number;
    };
    customer_details?: {
      first_name?: string;
      email?: string;
    };
  }

  class Snap {
    constructor(options: SnapOptions);
    createTransactionToken(parameter: TransactionDetails): Promise<string>;
  }

  const Midtrans: {
    Snap: typeof Snap;
  };

  export = Midtrans;
}