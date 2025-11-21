export class ReportDto {
    email: string;
    date: string;
    age: number;
    type: string;
    description: string;
    location: {latitud: string, longitud: string};
    sendTime: Date;
}