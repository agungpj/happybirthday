import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "agung2-apps",
      clientEmail: "firebase-adminsdk-hyt3j@agung2-apps.iam.gserviceaccount.com",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEugIBADANBgkqhkiG9w0BAQEFAASCBKQwggSgAgEAAoIBAQCUsQ9liZiDdmEk\n+S7qfpEGoWgCEC52H696puvIdWlyWr2nhe24IDeHD2AVGjDmOhfCpGSndY3F2+cX\nMcE0Ia27Zm8KRZZXgaoBxVnCHNmfawlDqoOUU4bfMHpF5jbJk3C6h7IJM99Xwk2u\n0muaJjRcj7BT3OaVxRyFo5G2hV2IHzvJpdfDoXFuagADvUuSHeLknLDNfpspbzVk\nrf5ZdOflKvsge5mFobsxB4bIrPFL7Kh8OrgLrRzl2VmKs1w/Xmfuu6MBZnCPO2bn\nSXoIpfM2mDsohYXriGNFl0C28TZc9BEppFp012Y0znEbMCx/vIfZHB+hPek0H4sW\nDTP7BI2pAgMBAAECggEACwVSoFKCAOBx09U6UnweELE+7cQ4RV4U2hDsMfft4GF0\nZCnLlFWi9/o+Q2IlFLNilnUr1rOiVfN2HeR8rvn+EAFIIqlEuuir6qSvgfE0ehnr\nXl4RkZldSkakEXE+R1OLy++J1R/Ioo8OxfHnss25HNEznwuk9Z3d/tPAVZht9cxJ\n6h3Fk8BBTxrZYYI40hSM3UY2wv4bN5eRa6uAxQHFZqUKHmM46myWkwhiXWL6I0Kk\ndkyYnCifcojL9V74Kq3+Xlc2bVqat/Ikf3YXWsUuC8QT8v5+GgNEg64AUfjQnqs1\nZAy+mJ1WW7HlzhJq2zkIzxiYeIkiZac9BAoUnbFTeQKBgQDISgDqhTK3+8uBX3S/\nMa1j+tCg1Apxt4m5BvMf2V3hzJYh4TbRJc8CUmweFNFIyS3GDUDXjwMad0ZErTV5\nbwtmug9ZJQPBAk4cDvquUQX0TeWnpgGANLIBQVQTkGilYHJGgFYK8rt89h8DSKvG\nVQH30HrFCcox1Tlo/AyDZ19a1QKBgQC+DPRxoU9xTloP19+McJlyuNU0TTRGqGAR\n7ADIEztXITpK7eD5uNYsmMdyaWy+3sZiAHT3nBas6iXbYoPx2jKJqPSpHcK7OKnq\nco/W+fmZTWeR5gvozo9rDs1O7xV12H6FXvZsG0O6mhVazGsbHKMAzyMuhpuxviaU\nL9D1u9VphQKBgD8NzSwHsufpBTA9dOucIBIRrAx1tLQIK/tsDK5CKCQl3D3eQPun\nA3yfphnyQ9C+RQLMuVUjWL7EPgLw5JzOMLCucpaF6KCisSR0MsceCtnWjC4zPNW3\nwTJT9rwSAl/N9Svsyym3MP8uHKVUA3/00yHJKF1Pr6/wiJpcfzP/Hy3hAn90jX1c\nMpGF64dQMBPpDSUONkyKxs5IhvpkA1h3W1QJG1eknD5c5/5xW0D16bHHXNhNQfp5\n4EAHy5Fr+f7xU9+qjPN+w8GpEBcksR2FuchZPB9IWszy+br67Rj8T6PZoev130dB\nBXeD+PsftD37YpSU6nOpFORnHTaLqsd77LX1AoGAfC6nzg/6igEQC+zkU0v4Jt8D\nuYbUEyto+QMk+RoY8Eq1Sx3AtrcHW2uWOysYjsLByYNVVBrdcnEf+C6xgIR9RDLK\nVcAVPPbw67JMe8cgFAgI/HQgr7xk0Lz2be+3vG0yAbmJ60831gC6GrgbyCLXCNNL\nfzNe9zoKGRwQKgNu/bU=\n-----END PRIVATE KEY-----\n",
    }),
  });
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { title, message, link } = req.body;

    const payload = {
      topic: "general",
      notification: {
        title: title,
        body: message,
      },
      webpush: link
        ? {
            fcmOptions: {
              link: link,
            },
          }
        : undefined,
    };

    try {
      await admin.messaging().send(payload);
      console.log(payload)
      res.status(200).json({ success: true, message: payload.notification });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  } else {
    res.status(405).json({ success: false, error: "Method Not Allowed" });
  }
}

