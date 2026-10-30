#!/usr/bin/env python3
"""Checks a Tizen .wgt's two signatures (author and distributor): each one against its certificate, and every
file's digest. Used by the release workflow, so a package the TV would refuse is never published.

    python3 tools/verify_wgt.py FreeMyTV-tizen.wgt
"""
import base64, hashlib, sys, zipfile, urllib.parse
from lxml import etree
from cryptography import x509
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding

NS = {'ds': 'http://www.w3.org/2000/09/xmldsig#'}
z = zipfile.ZipFile(sys.argv[1])
failed = False
for name in ('author-signature.xml', 'signature1.xml'):
    root = etree.fromstring(z.read(name))
    si = root.find('ds:SignedInfo', NS)
    c14n = etree.tostring(si, method='c14n', exclusive=True)
    sig = base64.b64decode(''.join(root.find('ds:SignatureValue', NS).text.split()))
    certs = [x509.load_der_x509_certificate(base64.b64decode(''.join(c.text.split())))
             for c in root.iter('{%s}X509Certificate' % NS['ds'])]
    try:
        certs[0].public_key().verify(sig, c14n, padding.PKCS1v15(), hashes.SHA512())
        ok = 'valid'
    except Exception as e:
        ok = 'INVALID (%s)' % type(e).__name__
        failed = True
    # The author's certificate was issued by the next one, the Tizen Developers CA (the distributor's KeyInfo carries
    # another CA's certificate there, as Samsung's own tools write it).
    if name == 'author-signature.xml' and len(certs) > 1:
        try:
            certs[0].verify_directly_issued_by(certs[1])
        except Exception:
            ok += ', NOT ISSUED BY ' + certs[1].subject.rfc4514_string()
            failed = True
    bad = 0
    for ref in si.findall('ds:Reference', NS):
        uri = urllib.parse.unquote(ref.get('URI'))
        if uri.startswith('#'):
            continue
        digest = base64.b64decode(ref.find('ds:DigestValue', NS).text)
        if hashlib.sha512(z.read(uri)).digest() != digest:
            bad += 1
            failed = True
    print('%-22s signature %s; leaf %s (issuer %s); %d bad digests' % (
        name, ok, certs[0].subject.rfc4514_string(), certs[0].issuer.rfc4514_string(), bad))
sys.exit(1 if failed else 0)
