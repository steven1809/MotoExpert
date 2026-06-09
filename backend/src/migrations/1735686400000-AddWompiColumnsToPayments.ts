import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddWompiColumnsToPayments1735686400000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("payments", [
            new TableColumn({
                name: "wompi_payment_link",
                type: "text",
                isNullable: true,
            }),
            new TableColumn({
                name: "wompi_transaction_id",
                type: "text",
                isNullable: true,
            }),
            new TableColumn({
                name: "wompi_reference",
                type: "text",
                isNullable: true,
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns("payments", [
            "wompi_payment_link",
            "wompi_transaction_id",
            "wompi_reference"
        ]);
    }

}
