# Scan routes
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
import uuid
from config.database import get_database
from middleware.auth import get_current_user
from utils.jwt import TokenData
from schemas.scan import ScanRequest, ScanResult
from services.scan_service import run_scan
from services.activity_service import log_activity

router = APIRouter(prefix='/scan', tags=['Scans'])

@router.post('', response_model=ScanResult)
async def start_scan(
    scan_request: ScanRequest,
    background_tasks: BackgroundTasks,
    current_user: TokenData = Depends(get_current_user),
    db = Depends(get_database)
):
    """Start a vulnerability scan for a repository"""
    # Verify repository ownership
    repo = await db.repositories.find_one({
        'id': scan_request.repository_id,
        'user_id': current_user.user_id
    })
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Repository not found')
    
    # Create scan result
    scan_result = ScanResult(
        scan_id=str(uuid.uuid4()),
        repository_id=scan_request.repository_id,
        status='pending',
        phase='discovery'
    )
    
    doc = scan_result.model_dump()
    doc['started_at'] = doc['started_at'].isoformat()
    
    await db.scans.insert_one(doc)
    
    # Start background scan
    background_tasks.add_task(run_scan, scan_result.scan_id, scan_request.repository_id, db)
    
    # Log activity
    await log_activity(db, current_user.user_id, 'scan_started', 'repository', scan_request.repository_id)
    
    return scan_result

@router.get('/{scan_id}', response_model=ScanResult)
async def get_scan_status(
    scan_id: str,
    current_user: TokenData = Depends(get_current_user),
    db = Depends(get_database)
):
    """Get the status of a scan"""
    scan = await db.scans.find_one({'scan_id': scan_id}, {'_id': 0})
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Scan not found')
    
    return ScanResult(**scan)
