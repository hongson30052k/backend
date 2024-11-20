import jsonServer from "json-server";
const server = jsonServer.create();
const router = jsonServer.router("db.json");
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors, and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.get("/echo", (req, res) => {
  res.jsonp(req.query);
});

server.use(jsonServer.bodyParser);

// Thêm createdAt khi POST
server.use((req, res, next) => {
  if (req.method === "POST") {
    req.body.createdAt = Date.now();
  }
  next();
});

// Xử lý PUT để cập nhật thông tin giỏ hàng
server.put("/cart", (req, res) => {
  const { productId } = req.query; // Lấy productId từ query
  const { quantity } = req.body; // Lấy quantity (hoặc thông tin khác) từ body request

  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }

  if (!quantity) {
    return res.status(400).json({ error: "quantity is required" });
  }

  const db = router.db;
  const cart = db.get("cart").value(); // Giả sử giỏ hàng của bạn lưu trữ trong "cart"

  // Tìm sản phẩm trong giỏ hàng
  const cartItemIndex = cart.findIndex((item) => item.productId === productId);

  if (cartItemIndex === -1) {
    return res.status(404).json({ error: "Product not found in cart" });
  }

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  db.get("cart")
    .get(cartItemIndex)
    .assign({ quantity }) // Hoặc có thể cập nhật các thuộc tính khác như giá, tổng tiền...
    .write();

  res.status(200).json({
    message: `Cart updated successfully for productId ${productId}`,
    cart: db.get("cart").value(), // Trả về giỏ hàng đã được cập nhật
  });
});

// Xử lý DELETE cho sản phẩm
server.delete("/products", (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }
  const db = router.db;
  const products = db.get("products").value();

  const productIndex = products.findIndex(
    (product) => product.productId === productId
  );

  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  db.get("products").remove({ productId }).write();

  res.status(200).json({
    message: `Product with productId ${productId} deleted successfully`,
  });
});

// Xử lý DELETE cho sản phẩm trong giỏ hàng
server.delete("/cart", (req, res) => {
  const { productId } = req.query;
  if (!productId) {
    return res.status(400).json({ error: "productId is required" });
  }
  const db = router.db;
  const cart = db.get("cart").value();

  const cartIndex = cart.findIndex((item) => item.productId === productId);

  if (cartIndex === -1) {
    return res.status(404).json({ error: "Product not found in cart" });
  }

  db.get("cart").remove({ productId }).write();

  res.status(200).json({
    message: `Product with productId ${productId} deleted from cart successfully`,
  });
});
server.get("/products/sortByPriceUnder1000K", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị category từ query parameters, nếu không có thì mặc định là null
  const category = req.query.category || null;

  // Lọc sản phẩm theo price (từ 0 đến 1000000)
  let filteredProducts = products.filter(
    (product) =>
      product.discounted_price >= 0 && product.discounted_price < 1000000
  );

  // Nếu có category, tiếp tục lọc theo category
  if (category) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category &&
        product.category.toLowerCase() === category.toLowerCase()
    );
  }

  console.log(
    "Filtered Products (Price from 0 to 1000000, Category: " + category + "):",
    filteredProducts
  );

  // Sắp xếp sản phẩm theo discounted_price (tăng dần)
  const sortedProducts = filteredProducts.sort(
    (a, b) => a.discounted_price - b.discounted_price
  );

  // Trả về kết quả
  res.status(200).json(sortedProducts);
});
server.get("/products/sortByPriceUnder1000KPage", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị category từ query parameters, nếu không có thì mặc định là null
  const category = req.query.category || null;

  // Lọc sản phẩm theo price (từ 0 đến 1000000)
  let filteredProducts = products.filter(
    (product) =>
      product.discounted_price >= 0 && product.discounted_price < 1000000
  );

  // Nếu có category, tiếp tục lọc theo category
  if (category) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category &&
        product.category.toLowerCase() === category.toLowerCase()
    );
  }

  console.log(
    "Filtered Products (Price from 0 to 1000000, Category: " + category + "):",
    filteredProducts
  );

  // Sắp xếp sản phẩm theo discounted_price (tăng dần)
  const sortedProducts = filteredProducts.sort(
    (a, b) => a.discounted_price - b.discounted_price
  );

  // Lấy tham số _page và _limit từ query
  const page = parseInt(req.query._page) || 1; // Mặc định là trang 1
  const limit = parseInt(req.query._limit) || 10; // Mặc định mỗi trang có 10 sản phẩm

  // Tính toán các chỉ số bắt đầu và kết thúc cho phân trang
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Lấy các sản phẩm trong phạm vi phân trang
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Trả về kết quả phân trang cùng tổng số sản phẩm
  res.status(200).json({
    total: sortedProducts.length, // Tổng số sản phẩm sau khi lọc và sắp xếp
    products: paginatedProducts, // Sản phẩm trong trang hiện tại
  });
});

server.get("/products/sortByPriceFrom1mto5m", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị category từ query parameters, nếu không có thì mặc định là null
  const category = req.query.category ? req.query.category.trim() : null;

  // Lọc sản phẩm theo price (từ 0 đến 1000000)
  let filteredProducts = products.filter(
    (product) =>
      product.discounted_price >= 1000000 && product.discounted_price < 5000000
  );

  // Nếu có category, tiếp tục lọc theo category
  if (category) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category &&
        product.category.toLowerCase() === category.toLowerCase()
    );
  }

  console.log(
    "Filtered Products (Price from 1m to 5m, Category: " + category + "):",
    filteredProducts
  );

  // Sắp xếp sản phẩm theo discounted_price (tăng dần)
  const sortedProducts = filteredProducts.sort(
    (a, b) => a.discounted_price - b.discounted_price
  );

  // Trả về kết quả
  res.status(200).json(sortedProducts);
});

server.get("/products/sortByPriceFrom1mto5mPage", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị category từ query parameters, nếu không có thì mặc định là null
  const category = req.query.category ? req.query.category.trim() : null;

  // Lọc sản phẩm theo price (từ 1 triệu đến 5 triệu)
  let filteredProducts = products.filter(
    (product) =>
      product.discounted_price >= 1000000 && product.discounted_price < 5000000
  );

  // Nếu có category, tiếp tục lọc theo category
  if (category) {
    filteredProducts = filteredProducts.filter(
      (product) =>
        product.category &&
        product.category.toLowerCase() === category.toLowerCase()
    );
  }

  console.log(
    "Filtered Products (Price from 1m to 5m, Category: " + category + "):",
    filteredProducts
  );

  // Sắp xếp sản phẩm theo discounted_price (tăng dần)
  const sortedProducts = filteredProducts.sort(
    (a, b) => a.discounted_price - b.discounted_price
  );

  // Lấy tham số _page và _limit từ query
  const page = parseInt(req.query._page) || 1; // Mặc định là trang 1
  const limit = parseInt(req.query._limit) || 10; // Mặc định mỗi trang có 10 sản phẩm

  // Tính toán các chỉ số bắt đầu và kết thúc cho phân trang
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Lấy các sản phẩm trong phạm vi phân trang
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Trả về kết quả phân trang cùng tổng số sản phẩm
  res.status(200).json({
    total: sortedProducts.length, // Tổng số sản phẩm sau khi lọc và sắp xếp
    products: paginatedProducts, // Sản phẩm trong trang hiện tại
  });
});

server.get("/products/sortByPriceOver5m", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị category từ query parameters (nếu có)
  const category = req.query.category ? req.query.category.trim() : null;

  // Lọc sản phẩm theo price (từ 5 triệu trở lên)
  let filteredProducts = products.filter(
    (product) => product.discounted_price >= 5000000
  );

  // Nếu có category, tiếp tục lọc theo category
  if (category) {
    filteredProducts = filteredProducts.filter((product) => {
      // Kiểm tra xem product.category có tồn tại và chuẩn hóa dữ liệu
      if (product.category) {
        // Nếu category là số, chuyển category thành chuỗi
        const productCategory =
          typeof product.category === "string"
            ? product.category.trim()
            : String(product.category).trim();
        return productCategory.toLowerCase() === category.toLowerCase();
      }
      return false;
    });
  }

  console.log(
    "Filtered Products (Price over 5M, Category: " + category + "):",
    filteredProducts
  );

  // Sắp xếp sản phẩm theo discounted_price (tăng dần)
  const sortedProducts = filteredProducts.sort(
    (a, b) => a.discounted_price - b.discounted_price
  );

  // Trả về kết quả
  res.status(200).json(sortedProducts);
});
server.get("/products/sortByPriceOver5mPage", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị category từ query parameters (nếu có)
  const category = req.query.category ? req.query.category.trim() : null;

  // Lấy giá trị page và limit từ query parameters (có thể có giá trị mặc định)
  const page = parseInt(req.query._page) || 1; // Mặc định là trang 1 nếu không có tham số _page
  const limit = parseInt(req.query._limit) || 10; // Mặc định là 10 sản phẩm trên mỗi trang

  // Lọc sản phẩm theo price (từ 5 triệu trở lên)
  let filteredProducts = products.filter(
    (product) => product.discounted_price >= 5000000
  );

  // Nếu có category, tiếp tục lọc theo category
  if (category) {
    filteredProducts = filteredProducts.filter((product) => {
      // Kiểm tra xem product.category có tồn tại và chuẩn hóa dữ liệu
      if (product.category) {
        // Nếu category là số, chuyển category thành chuỗi
        const productCategory =
          typeof product.category === "string"
            ? product.category.trim()
            : String(product.category).trim();
        return productCategory.toLowerCase() === category.toLowerCase();
      }
      return false;
    });
  }

  console.log(
    "Filtered Products (Price over 5M, Category: " + category + "):",
    filteredProducts
  );

  // Sắp xếp sản phẩm theo discounted_price (tăng dần)
  const sortedProducts = filteredProducts.sort(
    (a, b) => a.discounted_price - b.discounted_price
  );

  // Tính toán chỉ số bắt đầu và kết thúc của trang
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Cắt sản phẩm theo phạm vi trang
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  // Trả về kết quả phân trang
  res.status(200).json({
    total: filteredProducts.length, // Tổng số sản phẩm sau khi lọc
    totalPages: Math.ceil(filteredProducts.length / limit), // Tổng số trang
    currentPage: page,
    products: paginatedProducts, // Các sản phẩm trong trang hiện tại
  });
});

server.get("/products/searchByName", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị name từ query parameters
  const nameQuery = req.query.name_like
    ? req.query.name_like.trim().toLowerCase()
    : "";

  if (!nameQuery) {
    return res.status(400).json({ error: "Name query parameter is required" });
  }

  // Lọc sản phẩm theo tên (name) chứa giá trị nameQuery
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(nameQuery)
  );

  // Trả về kết quả tìm kiếm
  res.status(200).json(filteredProducts);
});

server.get("/products/searchByNamePage", (req, res) => {
  const db = router.db;
  const products = db.get("products").value();

  // Lấy giá trị name từ query parameters
  const nameQuery = req.query.name_like
    ? req.query.name_like.trim().toLowerCase()
    : "";

  // Lấy tham số phân trang (_page và _limit)
  const page = parseInt(req.query._page) || 1; // Mặc định là trang 1 nếu không có tham số
  const limit = parseInt(req.query._limit) || 5; // Mặc định là 5 sản phẩm mỗi trang nếu không có tham số

  // Kiểm tra xem tên query có hợp lệ không
  if (!nameQuery) {
    return res.status(400).json({ error: "Name query parameter is required" });
  }

  // Lọc sản phẩm theo tên (name) chứa giá trị nameQuery
  let filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(nameQuery)
  );

  // Tính toán phân trang
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  // Slicing mảng để lấy sản phẩm theo phân trang
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Trả về kết quả tìm kiếm và phân trang
  res.status(200).json(paginatedProducts);

  // Thêm header X-Total-Count để cho biết tổng số sản phẩm sau khi lọc
  res.setHeader("X-Total-Count", filteredProducts.length);
});

// Chạy router JSON Server
server.use(router);

// Lắng nghe trên cổng 5000
server.listen(5000, () => {
  console.log("JSON Server is running on http://localhost:5000");
});
