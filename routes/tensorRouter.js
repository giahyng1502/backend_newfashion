const express = require('express');

const router = express.Router();
const axios = require("axios");
const {Product, Features} = require("../models/productModel");
const BASE_URL = 'https://search-product-by-image-992734735800.asia-southeast1.run.app'
router.post('/store-product-features', async (req, res) => {
    try {
        const { productId, imageUrls } = req.body;

        if (!productId || !imageUrls || imageUrls.length === 0) {
            return res.status(400).json({ message: "productId và imageUrls là bắt buộc." });
        }

        // Gửi dữ liệu đến Flask API
        const response = await axios.post(`${BASE_URL}/extract_features`, { imageUrls }, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        const imageFeatures = response.data;
        const features = new Features({
            productId: productId,
            imageFeatures : imageFeatures
        })
        await features.save();
        // Trả về phản hồi thành công
        res.status(200).json({ message: 'Lưu trữ đặc trưng ảnh thành công!' , data: response.data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Đã có lỗi xảy ra khi lưu trữ đặc trưng ảnh.' });
    }
});
// Sử dụng trong API
// Tìm kiếm sản phẩm tương tự dựa trên ảnh
router.post('/search-by-image', async (req, res) => {
    try {
        const { imageUrl, topK = 5 } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ message: "Thiếu imageUrl" });
        }

        // Gửi ảnh để trích xuất vector
        const extractRes = await axios.post(`${BASE_URL}/extract_features`, { imageUrls: [imageUrl] });

        if (!extractRes.data || extractRes.data.length === 0) {
            return res.status(500).json({ message: "Không thể trích xuất đặc trưng từ ảnh." });
        }

        const vector = extractRes.data[0].features;

        // Gửi vector tới Flask để tìm kiếm sản phẩm tương tự
        const searchRes = await axios.post(`${BASE_URL}/search`, { vector, k: topK });

        if (!searchRes.data?.result || searchRes.data.result.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm tương tự." });
        }
        const featureIds = searchRes.data.result;
        console.log("featureIds", featureIds);

// Sử dụng Promise.all để tìm từng feature (nếu có)
        const results = await Promise.all(
            featureIds.map(async (featureId) => {
                return Features.findOne({
                    imageFeatures: {
                        $elemMatch: { _id: featureId.id },
                    },
                }).populate("productId").lean();
            })
        );

// Trả về các thông tin cần thiết, lọc null + tránh trùng productId
        const seenProductIds = new Set();
        const formattedResults = [];

        for (const featureId of featureIds) {
            const item = results.find((r) =>
                r?.imageFeatures.some((f) => f._id.toString() === featureId.id)
            );

            if (!item || !item.productId) continue;

            if (seenProductIds.has(item.productId._id.toString())) continue;
            seenProductIds.add(item.productId._id.toString());

            const matchedFeature = item.imageFeatures.find(
                (f) => f._id.toString() === featureId.id
            );

            formattedResults.push({
                ...item.productId,
                imageUrl: matchedFeature?.imageUrl || null,
                distance: featureId.distance,
            });
        }

        res.status(200).json({
            message: "Tìm kiếm sản phẩm tương tự thành công",
            data: formattedResults,
        });



    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi khi tìm kiếm sản phẩm tương tự' });
    }
});
router.post('/add-product-vector', async (req, res) => {
    const { productId } = req.body;

    if (!productId) {
        return res.status(400).json({ message: 'productId là bắt buộc.' });
    }

    try {
        // Lấy imageFeatures từ cơ sở dữ liệu
        const product = await Features.findOne({productId: productId}).select('imageFeatures');

        if (!product || !product.imageFeatures || product.imageFeatures.length === 0) {
            return res.status(400).json({ message: 'Không tìm thấy imageFeatures cho sản phẩm này.' });
        }

        // Lấy vector từ imageFeatures (giả sử imageFeatures là mảng các vector)
        const vectors = product.imageFeatures;

        // Gửi yêu cầu POST đến API Flask để thêm các vector vào FAISS
        const response = await axios.post(`${BASE_URL}/add`, {
            imageFeatures: vectors  // Gửi mảng vector đến Flask
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log(response)
        // Xử lý phản hồi từ Flask
        if (response.status === 200) {
            return res.status(200).json({ message: 'Thêm vector thành công vào FAISS!' });
        } else {
            return res.status(500).json({ message: 'Lỗi khi thêm vector vào FAISS.' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Đã có lỗi xảy ra khi gửi yêu cầu đến Flask API.' });
    }
});

router.get('/train', async (req, res) => {
    try {
        const products = await Product.find({});
        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'Không có sản phẩm nào.' });
        }
        let index = 0
        for (const item of products) {
            const imageUrls = item.image || [];
            const productId = item._id;

            const response = await axios.post(`${BASE_URL}/extract_features`, { imageUrls }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status === 200) {
                const imageFeatures = response.data;
                const features = new Features({
                    productId: productId,
                    imageFeatures: imageFeatures
                });
                await features.save();
                index++;
                console.log(`đã train thành công ${index}`)
            }
        }

        res.status(200).json({ message: 'Train thành công!' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Có lỗi xảy ra.', error: err });
    }
});
router.get('/save', async (req, res) => {
    try {
        const features = await Features.find({});
        let index = 0;

        for (const item of features) {  // ✅ dùng of để lấy phần tử
            const vectors = item.imageFeatures;

            const response = await axios.post(`${BASE_URL}/add`, {
                imageFeatures: vectors
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 200) {
                index++;
                console.log(`Đã lưu thành công ${index}`);
            }
        }

        return res.status(200).json({ message: `Đã lưu thành công ${index} sản phẩm.` });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Có lỗi xảy ra.', error: err });
    }
});


module.exports = router;
