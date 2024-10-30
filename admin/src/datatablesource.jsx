export const userColumns = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "user",
    headerName: "User",
    width: 230,
    renderCell: (params) => {
      return (
        <div className="cellWithImg">
          <img className="cellImg" src={params.row.img || "https://e7.pngegg.com/pngimages/480/63/png-clipart-t-shirt-monkey-d-luffy-roronoa-zoro-one-piece-nami-t-shirt-photography-manga-thumbnail.png"} alt="avatar" />
          {params.row.username}
        </div>
      );
    },
  },
  {
    field: "email",
    headerName: "Email",
    width: 230,
  },

  {
    field: "country",
    headerName: "Country",
    width: 100,
  },
  {
    field: "city",
    headerName: "City",
    width: 200,
  },
  {
    field: "phone",
    headerName: "Phone",
    width: 150,
  },
];

export const roomCols = [{
  field:"_id",headerName: "ID", width: 200 },
  {
    field: "title",
    headerName: "Title",
    width: '150'
  },
  {
    field: "desc",
    headerName: "Description",
    width: '250'
  },
  {
    field: "price",
    headerName: "Price",
    width: '80'
  },
  {
    field: "maxpeople",
    headerName: "Max-people",
    width: '160'
  },
]
export const hotelCols = [{
  field:"_id",headerName: "ID", width: 200 },
  {
    field: "name",
    headerName: "Name",
    width: '130'
  },
  {
    field: "type",
    headerName: "Type",
    width: '60'
  },
  {
    field: "desc",
    headerName: "Title",
    width: '230'
  },
  {
    field: "city",
    headerName: "City",
    width: '100'
  },
]